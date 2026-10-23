// Add / edit one question. Works on a local copy; nothing changes in the game until "حفظ السؤال".
import { useState } from 'react';
import { Field, Modal, Segmented } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { ImagePicker } from '../ui/ImagePicker.tsx';
import { newId } from '../../../shared/engine.ts';
import { QUESTION_TYPE_LABELS } from '../../../shared/catalog.ts';
import { questionIssues } from '../../../shared/validation.ts';
import type { Option, Question, QuestionType } from '../../../shared/schema.ts';

export function emptyQuestion(type: QuestionType): Question {
  const base = { id: newId('q'), prompt: '', imageId: null, hint: '', explanation: '', concept: '' };
  switch (type) {
    case 'mcq': {
      const options = [0, 1, 2, 3].map(() => ({ id: newId('o'), text: '' }));
      return { ...base, type, options, correctId: options[0].id };
    }
    case 'tf':
      return { ...base, type, answer: true };
    case 'short':
      return { ...base, type, accepted: [''] };
    case 'order':
      return { ...base, type, items: [0, 1, 2].map(() => ({ id: newId('i'), text: '' })) };
  }
}

// Converts while keeping whatever can be kept (prompt, hint, explanation, option texts).
function convert(q: Question, type: QuestionType): Question {
  if (q.type === type) return q;
  const next = emptyQuestion(type);
  const keep = { id: q.id, prompt: q.prompt, imageId: q.imageId, hint: q.hint, explanation: q.explanation, concept: q.concept };
  const texts = (q.type === 'mcq' ? q.options.map((o) => o.text) : q.type === 'order' ? q.items.map((o) => o.text) : []).filter((t) => t.trim());
  if (next.type === 'mcq' && texts.length >= 2) {
    const options = texts.map((text) => ({ id: newId('o'), text }));
    return { ...next, ...keep, options, correctId: options[0].id };
  }
  if (next.type === 'order' && texts.length >= 2) return { ...next, ...keep, items: texts.map((text) => ({ id: newId('i'), text })) };
  return { ...next, ...keep } as Question;
}

function OptionList({
  items,
  onChange,
  min,
  max,
  correctId,
  onCorrect,
  ordered,
}: {
  items: Option[];
  onChange: (items: Option[]) => void;
  min: number;
  max: number;
  correctId?: string;
  onCorrect?: (id: string) => void;
  ordered?: boolean;
}) {
  const move = (i: number, d: number) => {
    const arr = items.slice();
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    onChange(arr);
  };
  return (
    <div className="option-list">
      {items.map((o, i) => (
        <div key={o.id} className={`option-row${correctId === o.id ? ' correct' : ''}`}>
          {onCorrect ? (
            <label className="correct-pick" title="الإجابة الصحيحة">
              <input type="radio" name="correct" checked={correctId === o.id} onChange={() => onCorrect(o.id)} aria-label={`الخيار ${i + 1} هو الإجابة الصحيحة`} />
              <span>{correctId === o.id ? <Icon name="check" size={16} /> : i + 1}</span>
            </label>
          ) : (
            <span className="order-num">{i + 1}</span>
          )}
          <input
            className="input"
            value={o.text}
            maxLength={200}
            placeholder={ordered ? `العنصر ${i + 1} في الترتيب الصحيح` : `الخيار ${i + 1}`}
            aria-label={ordered ? `العنصر ${i + 1}` : `نص الخيار ${i + 1}`}
            onChange={(e) => onChange(items.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)))}
          />
          {ordered && (
            <>
              <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="تحريك لأعلى">
                <Icon name="arrowUp" size={18} />
              </button>
              <button type="button" className="icon-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="تحريك لأسفل">
                <Icon name="arrowDown" size={18} />
              </button>
            </>
          )}
          <button type="button" className="icon-btn" disabled={items.length <= min} onClick={() => onChange(items.filter((x) => x.id !== o.id))} aria-label={`حذف ${ordered ? 'العنصر' : 'الخيار'} ${i + 1}`}>
            <Icon name="trash" size={18} />
          </button>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="btn small ghost" onClick={() => onChange([...items, { id: newId(ordered ? 'i' : 'o'), text: '' }])}>
          <Icon name="plus" size={16} /> {ordered ? 'إضافة عنصر' : 'إضافة خيار'}
        </button>
      )}
    </div>
  );
}

export function QuestionEditor({
  initial,
  isNew,
  concepts,
  onSave,
  onClose,
}: {
  initial: Question;
  isNew: boolean;
  concepts: string[];
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState<Question>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const errors = questionIssues(q);
  const set = (patch: Partial<Question>) => setQ((prev) => ({ ...prev, ...patch }) as Question);

  const save = () => {
    if (errors.length) {
      setShowErrors(true);
      return;
    }
    // Trim stray spaces so grading and display stay clean.
    const clean = structuredClone(q);
    clean.prompt = clean.prompt.trim();
    if (clean.type === 'mcq') clean.options = clean.options.map((o) => ({ ...o, text: o.text.trim() }));
    if (clean.type === 'order') clean.items = clean.items.map((o) => ({ ...o, text: o.text.trim() }));
    if (clean.type === 'short') clean.accepted = clean.accepted.map((a) => a.trim()).filter(Boolean);
    onSave(clean);
  };

  return (
    <Modal
      title={isNew ? 'سؤال جديد' : 'تعديل السؤال'}
      onClose={onClose}
      wide
      footer={
        <>
          {showErrors && errors.length > 0 && (
            <span className="foot-error" role="alert">
              <Icon name="warn" size={16} /> {errors[0]}
            </span>
          )}
          <button className="btn ghost" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn primary" onClick={save}>
            <Icon name="check" /> حفظ السؤال
          </button>
        </>
      }
    >
      <div className="qe">
        <div className="field">
          <span className="field-label">نوع السؤال</span>
          <Segmented
            label="نوع السؤال"
            value={q.type}
            onChange={(t) => setQ(convert(q, t))}
            options={[
              { value: 'mcq', label: QUESTION_TYPE_LABELS.mcq, icon: 'list' },
              { value: 'tf', label: QUESTION_TYPE_LABELS.tf, icon: 'check' },
              { value: 'short', label: QUESTION_TYPE_LABELS.short, icon: 'edit' },
              { value: 'order', label: QUESTION_TYPE_LABELS.order, icon: 'arrowDown' },
            ]}
          />
        </div>

        <Field label="نص السؤال" error={showErrors && !q.prompt.trim() ? 'اكتبي نص السؤال.' : null}>
          {(id) => (
            <textarea
              id={id}
              className="input lg"
              rows={2}
              maxLength={500}
              value={q.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
              placeholder={q.type === 'tf' ? 'مثال: تصنع الأوراق غذاء النبات.' : q.type === 'order' ? 'مثال: رتّبي مراحل نمو النبات:' : 'مثال: ما الجزء الذي يمتص الماء من التربة؟'}
            />
          )}
        </Field>

        {q.type === 'mcq' && (
          <div className="field">
            <span className="field-label">الخيارات</span>
            <p className="field-hint">اضغطي الدائرة بجانب الإجابة الصحيحة. سيُخلط ترتيب الخيارات للطالبة إذا فعّلتِ ذلك في الإعدادات.</p>
            <OptionList items={q.options} min={2} max={6} correctId={q.correctId} onCorrect={(id) => set({ correctId: id })} onChange={(options) => set({ options, correctId: options.some((o) => o.id === q.correctId) ? q.correctId : options[0].id })} />
          </div>
        )}
        {q.type === 'tf' && (
          <div className="field">
            <span className="field-label">الإجابة الصحيحة</span>
            <div className="tf-pick">
              <button type="button" className={q.answer ? 'on true' : ''} onClick={() => set({ answer: true })} aria-pressed={q.answer}>
                <Icon name="check" /> صح
              </button>
              <button type="button" className={!q.answer ? 'on false' : ''} onClick={() => set({ answer: false })} aria-pressed={!q.answer}>
                <Icon name="x" /> خطأ
              </button>
            </div>
          </div>
        )}
        {q.type === 'short' && (
          <div className="field">
            <span className="field-label">الإجابات المقبولة</span>
            <p className="field-hint">
              تُقبل إجابة الطالبة إذا طابقت إحداها. نتجاهل تلقائيًا التشكيل والمسافات الزائدة واختلاف الهمزات (أ/ا) والتاء المربوطة (ة/ه) والأرقام العربية والهندية. أضيفي الصيغ الأخرى
              المقبولة (مثل المرادفات) كإجابات إضافية. يُفضّل استخدام هذا النوع للإجابات القصيرة المحددة (كلمة أو رقم).
            </p>
            <div className="option-list">
              {q.accepted.map((a, i) => (
                <div key={i} className="option-row">
                  <span className="order-num">
                    <Icon name="check" size={14} />
                  </span>
                  <input className="input" value={a} maxLength={120} aria-label={`الإجابة المقبولة ${i + 1}`} placeholder={i === 0 ? 'مثال: البناء الضوئي' : 'صيغة أخرى مقبولة'} onChange={(e) => set({ accepted: q.accepted.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <button type="button" className="icon-btn" disabled={q.accepted.length <= 1} onClick={() => set({ accepted: q.accepted.filter((_, j) => j !== i) })} aria-label="حذف الإجابة">
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ))}
              {q.accepted.length < 10 && (
                <button type="button" className="btn small ghost" onClick={() => set({ accepted: [...q.accepted, ''] })}>
                  <Icon name="plus" size={16} /> إضافة صيغة مقبولة
                </button>
              )}
            </div>
          </div>
        )}
        {q.type === 'order' && (
          <div className="field">
            <span className="field-label">العناصر بالترتيب الصحيح</span>
            <p className="field-hint">اكتبي العناصر من الأول إلى الأخير. ستظهر للطالبة مخلوطة لترتّبها بنفسها.</p>
            <OptionList items={q.items} min={2} max={8} ordered onChange={(items) => set({ items })} />
          </div>
        )}

        <details className="qe-more" open={!!(q.hint || q.explanation || q.concept || q.imageId)}>
          <summary>
            <Icon name="chevronDown" size={16} /> إضافات اختيارية: صورة، تلميح، تفسير، مفهوم
          </summary>
          <div className="row-2">
            <Field label="تلميح" optional hint="يظهر عندما تطلب الطالبة مساعدة.">
              {(id, d) => <textarea id={id} aria-describedby={d} className="input" rows={2} maxLength={300} value={q.hint} onChange={(e) => set({ hint: e.target.value })} placeholder="مثال: هذا الجزء يختبئ تحت الأرض." />}
            </Field>
            <Field label="تفسير الإجابة الصحيحة" optional hint="يظهر بعد الإجابة ليفهم الطالب السبب.">
              {(id, d) => <textarea id={id} aria-describedby={d} className="input" rows={2} maxLength={600} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} placeholder="مثال: الجذر يمتص الماء والأملاح من التربة." />}
            </Field>
          </div>
          <div className="row-2">
            <Field label="المفهوم أو المهارة" optional hint="يجمع الأسئلة في تقرير النتائج لمعرفة ما يحتاج إلى مراجعة.">
              {(id, d) => (
                <>
                  <input id={id} aria-describedby={d} className="input" list="concept-list" maxLength={60} value={q.concept} onChange={(e) => set({ concept: e.target.value })} placeholder="مثال: أجزاء النبات" />
                  <datalist id="concept-list">
                    {concepts.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <div className="field">
              <span className="field-label">
                صورة للسؤال <span className="field-optional">اختياري</span>
              </span>
              <ImagePicker value={q.imageId} onChange={(imageId) => set({ imageId })} maxSide={1000} label="رفع صورة" />
            </div>
          </div>
        </details>
      </div>
    </Modal>
  );
}
