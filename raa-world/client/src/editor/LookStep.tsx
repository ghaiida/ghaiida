import { Field, Segmented, SettingCard } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { TemplateArt } from '../ui/TemplateArt.tsx';
import { THEMES } from '../../../shared/catalog.ts';
import { THEME_IDS } from '../../../shared/schema.ts';
import type { StepProps } from './EditorPage.tsx';

export function LookStep({ doc, update }: StepProps) {
  const s = doc.settings;
  return (
    <div className="settings-grid">
      <SettingCard icon="palette" title="ألوان اللعبة وخلفيتها" description="مجموعات ألوان جاهزة ومتناسقة بتباين مريح للقراءة.">
        <div className="theme-grid" role="radiogroup" aria-label="ألوان اللعبة">
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const on = s.theme === id;
            return (
              <button key={id} role="radio" aria-checked={on} className={`theme-option${on ? ' selected' : ''}`} onClick={() => update((d) => void (d.settings.theme = id))}>
                <TemplateArt id={doc.templateId} theme={id} />
                <span className="theme-name">
                  {on && <Icon name="check" size={16} />} {t.name}
                </span>
                <span className="swatches" aria-hidden>
                  <i style={{ background: t.primary }} />
                  <i style={{ background: t.accent }} />
                  <i style={{ background: t.sky }} />
                </span>
              </button>
            );
          })}
        </div>
      </SettingCard>

      <SettingCard icon="user" title="مخاطبة اللاعب" description="صيغة الرسائل والأزرار داخل اللعبة.">
        <Segmented
          label="صيغة المخاطبة"
          value={s.address}
          onChange={(v) => update((d) => void (d.settings.address = v))}
          options={[
            { value: 'f', label: 'للطالبات (أحسنتِ)' },
            { value: 'm', label: 'للطلاب (أحسنت)' },
          ]}
        />
      </SettingCard>

      <SettingCard icon="sparkles" title="الرسائل" description="تظهر في بداية اللعبة ونهايتها.">
        <Field label="رسالة الترحيب">
          {(id) => <textarea id={id} className="input" rows={2} maxLength={400} value={s.welcomeMessage} onChange={(e) => update((d) => void (d.settings.welcomeMessage = e.target.value))} placeholder="مثال: أهلًا بكِ في مغامرة اليوم!" />}
        </Field>
        <Field label="رسالة إكمال اللعبة">
          {(id) => <textarea id={id} className="input" rows={2} maxLength={400} value={s.completionMessage} onChange={(e) => update((d) => void (d.settings.completionMessage = e.target.value))} placeholder="مثال: أحسنتِ! أنهيتِ المغامرة بنجاح." />}
        </Field>
      </SettingCard>

      <p className="muted small">اسم اللعبة وصورة الغلاف وشعار المدرسة تجدينها في خطوة «بيانات اللعبة».</p>
    </div>
  );
}
