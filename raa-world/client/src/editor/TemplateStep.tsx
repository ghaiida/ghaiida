import { Icon } from '../ui/Icon.tsx';
import { TemplateArt } from '../ui/TemplateArt.tsx';
import { TEMPLATES, DIFFICULTY_LABELS } from '../../../shared/catalog.ts';
import { DIFFICULTY_RULES } from '../../../shared/engine.ts';
import { TEMPLATE_IDS } from '../../../shared/schema.ts';
import type { StepProps } from './EditorPage.tsx';

export function TemplateStep({ doc, update }: StepProps) {
  return (
    <>
      <p className="lead">
        القالب يحدد <b>طريقة اللعب</b>، أما الأسئلة فتبقى كما هي. يمكنكِ تبديل القالب في أي وقت وتجربة الفرق بالمعاينة.
      </p>
      <div className="template-grid" role="radiogroup" aria-label="قالب اللعب">
        {TEMPLATE_IDS.map((id) => {
          const t = TEMPLATES[id];
          const on = doc.templateId === id;
          return (
            <button key={id} role="radio" aria-checked={on} className={`template-card${on ? ' selected' : ''}`} onClick={() => update((d) => void (d.templateId = id))}>
              {on && (
                <span className="selected-badge">
                  <Icon name="check" size={16} /> القالب المختار
                </span>
              )}
              <TemplateArt id={id} theme={doc.settings.theme} />
              <h3>{t.name}</h3>
              <p className="muted">{t.tagline}</p>
              <ul>
                {t.howToPlay.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p className="best-for">
                <Icon name="target" size={16} /> مناسب لـ: {t.bestFor}
              </p>
              <div className="difficulty-note">
                <b>المستوى الحالي ({DIFFICULTY_LABELS[doc.settings.difficulty]}):</b> {DIFFICULTY_RULES[id][doc.settings.difficulty]}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
