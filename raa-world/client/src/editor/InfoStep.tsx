import { Field } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { ImagePicker } from '../ui/ImagePicker.tsx';
import { GRADES, SUBJECTS, TERMS } from '../../../shared/catalog.ts';
import type { StepProps } from './EditorPage.tsx';

// A select with a fixed list plus "other" → free text, so any subject or grade fits.
function ListOrOther({ id, value, list, onChange, placeholder }: { id: string; value: string; list: string[]; onChange: (v: string) => void; placeholder: string }) {
  const inList = !value || list.includes(value);
  return (
    <div className="list-or-other">
      <select id={id} className="input" value={inList ? value : '__other'} onChange={(e) => onChange(e.target.value === '__other' ? ' ' : e.target.value)}>
        <option value="">— اختاري —</option>
        {list.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value="__other">أخرى (اكتبيها)</option>
      </select>
      {!inList && <input className="input" value={value.trimStart()} onChange={(e) => onChange(e.target.value || ' ')} placeholder={placeholder} maxLength={40} autoFocus />}
    </div>
  );
}

export function InfoStep({ doc, update }: StepProps) {
  const m = doc.meta;
  const set = <K extends keyof typeof m>(k: K, v: (typeof m)[K]) => update((d) => void (d.meta[k] = v));
  return (
    <div className="form-grid">
      <section className="panel">
        <h2 className="panel-title">عن اللعبة</h2>
        <Field label="اسم اللعبة" hint="يظهر للطالبة في شاشة البداية.">
          {(id, d) => <input id={id} aria-describedby={d} className="input lg" value={m.title} maxLength={80} onChange={(e) => set('title', e.target.value)} placeholder="مثال: رحلة داخل النبات" />}
        </Field>
        <div className="row-2">
          <Field label="المادة الدراسية">
            {(id) => <ListOrOther id={id} value={m.subject} list={SUBJECTS} onChange={(v) => set('subject', v)} placeholder="اكتبي اسم المادة" />}
          </Field>
          <Field label="الصف الدراسي">
            {(id) => <ListOrOther id={id} value={m.grade} list={GRADES} onChange={(v) => set('grade', v)} placeholder="مثال: رياض الأطفال" />}
          </Field>
        </div>
        <div className="row-2">
          <Field label="الفصل الدراسي" optional>
            {(id) => (
              <select id={id} className="input" value={m.term} onChange={(e) => set('term', e.target.value)}>
                <option value="">— اختاري —</option>
                {TERMS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="عنوان الدرس أو الوحدة" optional>
            {(id) => <input id={id} className="input" value={m.lesson} maxLength={120} onChange={(e) => set('lesson', e.target.value)} placeholder="مثال: أجزاء النبات ووظائفها" />}
          </Field>
        </div>
        <Field label="وصف قصير للطالبات" optional hint="جملة أو جملتان تشرح فكرة اللعبة.">
          {(id, d) => (
            <textarea id={id} aria-describedby={d} className="input" rows={2} value={m.description} maxLength={400} onChange={(e) => set('description', e.target.value)} placeholder="مثال: اجمعي النجوم وافتحي مناطق الحديقة باكتشاف أسرار النبات!" />
          )}
        </Field>
      </section>

      <section className="panel">
        <h2 className="panel-title">أهداف اللعبة التعليمية</h2>
        <p className="muted small">تظهر لكِ في لوحة التحكم وتساعدكِ على ربط الأسئلة بأهداف الدرس.</p>
        <ol className="objectives">
          {m.objectives.map((o, i) => (
            <li key={i}>
              <input
                className="input"
                value={o}
                maxLength={200}
                aria-label={`الهدف ${i + 1}`}
                onChange={(e) => update((d) => void (d.meta.objectives[i] = e.target.value))}
                placeholder={i === 0 ? 'مثال: تتعرّف الطالبة أجزاء النبات الرئيسة.' : 'هدف آخر'}
              />
              {m.objectives.length > 1 && (
                <button className="icon-btn" aria-label={`حذف الهدف ${i + 1}`} onClick={() => update((d) => void d.meta.objectives.splice(i, 1))}>
                  <Icon name="trash" size={18} />
                </button>
              )}
            </li>
          ))}
        </ol>
        {m.objectives.length < 6 && (
          <button className="btn small ghost" onClick={() => update((d) => void d.meta.objectives.push(''))}>
            <Icon name="plus" size={16} /> إضافة هدف
          </button>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">المعلمة والمدرسة</h2>
        <div className="row-2">
          <Field label="اسم المعلمة" optional>
            {(id) => <input id={id} className="input" value={m.teacherName} maxLength={80} onChange={(e) => set('teacherName', e.target.value)} placeholder="مثال: أ. نورة الحربي" />}
          </Field>
          <Field label="اسم المدرسة" optional>
            {(id) => <input id={id} className="input" value={m.schoolName} maxLength={80} onChange={(e) => set('schoolName', e.target.value)} placeholder="مثال: الابتدائية العاشرة بالرياض" />}
          </Field>
        </div>
        <div className="row-2">
          <div className="field">
            <span className="field-label">
              شعار المدرسة <span className="field-optional">اختياري</span>
            </span>
            <ImagePicker value={m.logoId} onChange={(v) => set('logoId', v)} maxSide={400} label="رفع الشعار" shape="square" />
          </div>
          <div className="field">
            <span className="field-label">
              صورة غلاف اللعبة <span className="field-optional">اختياري</span>
            </span>
            <ImagePicker value={m.coverId} onChange={(v) => set('coverId', v)} maxSide={1400} label="رفع صورة الغلاف" />
          </div>
        </div>
      </section>
    </div>
  );
}
