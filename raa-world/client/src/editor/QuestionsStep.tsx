import { useMemo, useState } from 'react';
import { useFeedback } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { assetUrl, LOCAL } from '../api.ts';
import { QuestionEditor, emptyQuestion } from './QuestionEditor.tsx';
import { ImportDialog } from './ImportDialog.tsx';
import { QUESTION_TYPE_LABELS } from '../../../shared/catalog.ts';
import { correctAnswerText, newId } from '../../../shared/engine.ts';
import { questionIssues, MIN_QUESTIONS } from '../../../shared/validation.ts';
import { questionsToRows, toCsv } from '../../../shared/importer.ts';
import type { Question } from '../../../shared/schema.ts';
import type { StepProps } from './EditorPage.tsx';

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function QuestionsStep({ doc, update }: StepProps) {
  const { confirm, toast } = useFeedback();
  const [editing, setEditing] = useState<{ q: Question; isNew: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const concepts = useMemo(() => [...new Set(doc.questions.map((q) => q.concept.trim()).filter(Boolean))], [doc.questions]);
  const qs = doc.questions;

  const saveQuestion = (q: Question) => {
    update((d) => {
      const i = d.questions.findIndex((x) => x.id === q.id);
      if (i >= 0) d.questions[i] = q;
      else d.questions.push(q);
    });
    setEditing(null);
  };
  const move = (i: number, dir: number) =>
    update((d) => {
      const [x] = d.questions.splice(i, 1);
      d.questions.splice(i + dir, 0, x);
    });
  const duplicate = (i: number) =>
    update((d) => {
      const copy = structuredClone(d.questions[i]);
      copy.id = newId('q');
      d.questions.splice(i + 1, 0, copy);
    });
  const remove = async (i: number) => {
    const ok = await confirm({
      title: 'حذف السؤال',
      message: <p>هل تريدين حذف السؤال {i + 1}: «{qs[i].prompt.slice(0, 80) || 'بدون نص'}»؟</p>,
      confirmLabel: 'حذف السؤال',
      danger: true,
    });
    if (ok) update((d) => void d.questions.splice(i, 1));
  };

  return (
    <>
      <div className="questions-toolbar">
        <p className="lead">
          {qs.length === 0 ? 'لا توجد أسئلة بعد.' : `${qs.length} سؤال في هذه اللعبة.`}{' '}
          {qs.length < MIN_QUESTIONS && <span className="muted">تحتاج اللعبة إلى {MIN_QUESTIONS} أسئلة على الأقل لتُنشر.</span>}
        </p>
        <div className="toolbar-actions">
          <button className="btn primary" onClick={() => setEditing({ q: emptyQuestion('mcq'), isNew: true })} disabled={qs.length >= 100}>
            <Icon name="plus" /> إضافة سؤال
          </button>
          <button className="btn outline" onClick={() => setImporting(true)} disabled={qs.length >= 100}>
            <Icon name="upload" /> استيراد من Excel أو CSV
          </button>
          {qs.length > 0 && !LOCAL && (
            <button
              className="btn ghost"
              onClick={() => {
                downloadBlob(new Blob([toCsv(questionsToRows(qs))], { type: 'text/csv;charset=utf-8' }), `أسئلة - ${doc.meta.title || 'لعبة'}.csv`);
                toast('نُزّل ملف الأسئلة. يمكنكِ استيراده في لعبة أخرى.', 'info');
              }}
            >
              <Icon name="download" /> تصدير الأسئلة
            </button>
          )}
        </div>
      </div>

      {qs.length === 0 && (
        <div className="empty-questions">
          <div>
            <Icon name="edit" size={26} />
            <h3>أضيفي الأسئلة يدويًا</h3>
            <p>اختيار من متعدد، صح أو خطأ، إجابة قصيرة، ترتيب عناصر.</p>
            <button className="btn primary" onClick={() => setEditing({ q: emptyQuestion('mcq'), isNew: true })}>
              إضافة أول سؤال
            </button>
          </div>
          <div>
            <Icon name="upload" size={26} />
            <h3>أو استوردي ملفًا جاهزًا</h3>
            <p>نزّلي النموذج، اكتبي أسئلتكِ في Excel، ثم ارفعيه هنا.</p>
            <button className="btn outline" onClick={() => setImporting(true)}>
              استيراد الأسئلة
            </button>
          </div>
        </div>
      )}

      <ol className="question-list">
        {qs.map((q, i) => {
          const problems = questionIssues(q);
          return (
            <li key={q.id} className={`question-item${problems.length ? ' has-issue' : ''}`}>
              <span className="q-num">{i + 1}</span>
              <div className="q-main">
                <div className="q-tags">
                  <span className={`type-tag ${q.type}`}>{QUESTION_TYPE_LABELS[q.type]}</span>
                  {q.concept && <span className="concept-tag">{q.concept}</span>}
                  {q.hint && (
                    <span className="mini-tag" title="يوجد تلميح">
                      <Icon name="bulb" size={14} />
                    </span>
                  )}
                  {q.explanation && (
                    <span className="mini-tag" title="يوجد تفسير">
                      <Icon name="info" size={14} />
                    </span>
                  )}
                </div>
                <button className="q-prompt" onClick={() => setEditing({ q, isNew: false })}>
                  {q.prompt || <span className="muted">سؤال بلا نص</span>}
                </button>
                {problems.length > 0 ? (
                  <p className="q-issue">
                    <Icon name="warn" size={14} /> {problems[0]}
                  </p>
                ) : (
                  <p className="q-answer">
                    <Icon name="check" size={14} /> {correctAnswerText(q)}
                  </p>
                )}
              </div>
              {q.imageId && <img className="q-thumb" src={assetUrl(q.imageId)} alt="" />}
              <div className="q-actions">
                <button className="icon-btn" onClick={() => setEditing({ q, isNew: false })} aria-label={`تعديل السؤال ${i + 1}`} title="تعديل">
                  <Icon name="edit" size={18} />
                </button>
                <button className="icon-btn" onClick={() => duplicate(i)} aria-label={`نسخ السؤال ${i + 1}`} title="نسخ" disabled={qs.length >= 100}>
                  <Icon name="copy" size={18} />
                </button>
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="تحريك لأعلى" title="تحريك لأعلى">
                  <Icon name="arrowUp" size={18} />
                </button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === qs.length - 1} aria-label="تحريك لأسفل" title="تحريك لأسفل">
                  <Icon name="arrowDown" size={18} />
                </button>
                <button className="icon-btn danger-text" onClick={() => remove(i)} aria-label={`حذف السؤال ${i + 1}`} title="حذف">
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {qs.length > 0 && (
        <button className="btn ghost add-more" onClick={() => setEditing({ q: emptyQuestion(qs[qs.length - 1].type), isNew: true })} disabled={qs.length >= 100}>
          <Icon name="plus" /> إضافة سؤال آخر
        </button>
      )}

      {editing && <QuestionEditor initial={editing.q} isNew={editing.isNew} concepts={concepts} onSave={saveQuestion} onClose={() => setEditing(null)} />}
      {importing && (
        <ImportDialog
          room={100 - qs.length}
          concepts={concepts}
          onClose={() => setImporting(false)}
          onImport={(list) => {
            update((d) => void d.questions.push(...list));
            setImporting(false);
            toast(`أُضيف ${list.length} سؤال إلى اللعبة.`);
          }}
        />
      )}
    </>
  );
}
