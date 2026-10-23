// Import questions from CSV / Excel: download template → upload → review & fix → add.
import { useState } from 'react';
import { Modal } from '../ui/kit.tsx';
import { LOCAL } from '../api.ts';
import { Icon } from '../ui/Icon.tsx';
import { QuestionEditor } from './QuestionEditor.tsx';
import { downloadBlob } from './QuestionsStep.tsx';
import { COLUMN_HELP, TEMPLATE_EXAMPLE_ROWS, TEMPLATE_HEADERS, rowsToQuestions, toCsv, type ImportResult } from '../../../shared/importer.ts';
import { QUESTION_TYPE_LABELS } from '../../../shared/catalog.ts';
import { correctAnswerText } from '../../../shared/engine.ts';
import type { Question } from '../../../shared/schema.ts';

async function readRows(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) {
    const { default: readXlsxFile } = await import('read-excel-file');
    return (await readXlsxFile(file)) as unknown[][];
  }
  if (name.endsWith('.csv') || name.endsWith('.txt') || file.type === 'text/csv') {
    const Papa = (await import('papaparse')).default;
    const text = await file.text();
    const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ''), { skipEmptyLines: false });
    return parsed.data;
  }
  if (name.endsWith('.xls')) throw new Error('صيغة Excel القديمة (.xls) غير مدعومة. احفظي الملف بصيغة .xlsx أو CSV ثم ارفعيه.');
  throw new Error('اختاري ملفًا بصيغة .xlsx أو .csv.');
}

async function downloadXlsxTemplate() {
  const { default: writeXlsxFile } = await import('write-excel-file');
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS].map((r, i) => r.map((value) => ({ value, type: String, fontWeight: i === 0 ? ('bold' as const) : undefined })));
  const blob = (await writeXlsxFile(rows, { rightToLeft: true, columns: TEMPLATE_HEADERS.map((_, i) => ({ width: i === 1 ? 44 : i >= 7 ? 30 : 16 })) } as never)) as unknown as Blob;
  downloadBlob(blob, 'نموذج أسئلة راء وورلد.xlsx');
}

export function ImportDialog({ room, concepts, onClose, onImport }: { room: number; concepts: string[]; onClose: () => void; onImport: (qs: Question[]) => void }) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  const pick = async (file?: File) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    setFileName(file.name);
    try {
      if (file.size > 3 * 1024 * 1024) throw new Error('الملف كبير جدًا. الحد الأقصى ٣ ميغابايت.');
      const rows = await readRows(file);
      setResult(rowsToQuestions(rows));
      setExcluded(new Set());
    } catch (e) {
      setResult(null);
      setError((e as Error).message || 'تعذّر قراءة الملف. تأكدي أنه بصيغة النموذج.');
    } finally {
      setBusy(false);
    }
  };

  const chosen = result ? result.questions.filter((_, i) => !excluded.has(i)) : [];
  const tooMany = chosen.length > room;

  return (
    <Modal
      title="استيراد الأسئلة من ملف"
      onClose={onClose}
      wide
      footer={
        result && (
          <>
            {tooMany && <span className="foot-error">يمكن إضافة {room} سؤال فقط (الحد ١٠٠ سؤال لكل لعبة).</span>}
            <button className="btn ghost" onClick={onClose}>
              إلغاء
            </button>
            <button className="btn primary" disabled={!chosen.length || tooMany} onClick={() => onImport(chosen.map((c) => c.question))}>
              <Icon name="check" /> إضافة {chosen.length} سؤال إلى اللعبة
            </button>
          </>
        )
      }
    >
      {!result && (
        <div className="import-start">
          <ol className="import-steps">
            <li>
              {LOCAL ? (
                <>
                  <b>جهّزي ملف Excel أو CSV</b> صفّه الأول فيه هذه العناوين بالترتيب: {TEMPLATE_HEADERS.join('، ')}. (تنزيل النموذج الجاهز متاح في النسخة المنشورة على الإنترنت.)
                </>
              ) : (
                <>
                  <b>نزّلي النموذج</b> واكتبي أسئلتكِ فيه دون تغيير أسماء الأعمدة.
                </>
              )}
              {!LOCAL && <div className="btn-row">
                <button className="btn outline small" onClick={() => downloadXlsxTemplate().catch(() => setError('تعذّر تجهيز ملف Excel.'))}>
                  <Icon name="download" size={16} /> نموذج Excel (.xlsx)
                </button>
                <button className="btn ghost small" onClick={() => downloadBlob(new Blob([toCsv([TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS])], { type: 'text/csv;charset=utf-8' }), 'نموذج أسئلة راء وورلد.csv')}>
                  <Icon name="download" size={16} /> نموذج CSV
                </button>
              </div>}
            </li>
            <li>
              <b>ارفعي الملف</b> بصيغة .xlsx أو .csv، وسنراجعه قبل إضافة أي سؤال.
              <label className={`file-drop${busy ? ' busy' : ''}`}>
                <Icon name={busy ? 'refresh' : 'upload'} size={26} className={busy ? 'spin' : ''} />
                <span>{busy ? 'جارٍ قراءة الملف…' : 'اختاري الملف من جهازكِ'}</span>
                <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => pick(e.target.files?.[0])} disabled={busy} />
              </label>
            </li>
          </ol>
          {error && (
            <div className="alert error" role="alert">
              <Icon name="warn" size={18} /> {error}
            </div>
          )}
          <details className="columns-help" open={LOCAL}>
            <summary>
              <Icon name="info" size={16} /> طريقة تعبئة الأعمدة
            </summary>
            <table className="table">
              <tbody>
                {COLUMN_HELP.map((c) => (
                  <tr key={c.column}>
                    <th>{c.column}</th>
                    <td>{c.help}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}

      {result && (
        <div className="import-review">
          <div className="import-summary">
            <span className="file-name">
              <Icon name="file" size={16} /> {fileName}
            </span>
            <span className="ok-count">
              <Icon name="check" size={16} /> {result.questions.length} سؤال جاهز
            </span>
            {result.errors.length > 0 && (
              <span className="err-count">
                <Icon name="warn" size={16} /> {new Set(result.errors.map((e) => e.row)).size} صف يحتاج إلى تصحيح
              </span>
            )}
            <button className="btn small ghost" onClick={() => setResult(null)}>
              <Icon name="refresh" size={16} /> رفع ملف آخر
            </button>
          </div>

          {result.errors.length > 0 && (
            <div className="alert warn">
              <b>هذه الصفوف لن تُستورد.</b> صحّحيها في الملف ثم ارفعيه من جديد، أو أضيفيها يدويًا بعد الاستيراد:
              <ul className="error-rows">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    <b>الصف {e.row}:</b> {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.questions.length > 0 && (
            <>
              <p className="muted small">راجعي الأسئلة قبل إضافتها. يمكنكِ تعديل أي سؤال أو استبعاده.</p>
              <ol className="question-list compact">
                {result.questions.map(({ row, question }, i) => (
                  <li key={question.id} className={`question-item${excluded.has(i) ? ' excluded' : ''}`}>
                    <label className="include-check">
                      <input
                        type="checkbox"
                        checked={!excluded.has(i)}
                        onChange={() => {
                          const next = new Set(excluded);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          setExcluded(next);
                        }}
                        aria-label={`تضمين سؤال الصف ${row}`}
                      />
                    </label>
                    <div className="q-main">
                      <div className="q-tags">
                        <span className={`type-tag ${question.type}`}>{QUESTION_TYPE_LABELS[question.type]}</span>
                        <span className="mini-tag">الصف {row}</span>
                        {question.concept && <span className="concept-tag">{question.concept}</span>}
                      </div>
                      <p className="q-prompt static">{question.prompt}</p>
                      <p className="q-answer">
                        <Icon name="check" size={14} /> {correctAnswerText(question)}
                      </p>
                    </div>
                    <div className="q-actions">
                      <button className="icon-btn" onClick={() => setEditing(i)} aria-label={`تعديل سؤال الصف ${row}`}>
                        <Icon name="edit" size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}

      {editing !== null && result && (
        <QuestionEditor
          initial={result.questions[editing].question}
          isNew={false}
          concepts={concepts}
          onClose={() => setEditing(null)}
          onSave={(q) => {
            setResult({ ...result, questions: result.questions.map((x, i) => (i === editing ? { ...x, question: q } : x)) });
            setEditing(null);
          }}
        />
      )}
    </Modal>
  );
}
