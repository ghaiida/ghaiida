import { Field, Segmented, SettingCard, Toggle } from '../ui/kit.tsx';
import { DIFFICULTY_RULES } from '../../../shared/engine.ts';
import { TEMPLATES } from '../../../shared/catalog.ts';
import type { GameSettings } from '../../../shared/schema.ts';
import type { StepProps } from './EditorPage.tsx';

export function SettingsStep({ doc, update }: StepProps) {
  const s = doc.settings;
  const set = <K extends keyof GameSettings>(k: K, v: GameSettings[K]) => update((d) => void (d.settings[k] = v));
  const total = doc.questions.length;
  const countOptions = [5, 8, 10, 12, 15, 20, 25, 30].filter((n) => n < total && n >= 3);

  return (
    <div className="settings-grid">
      <SettingCard icon="target" title="مستوى التحدي" description={`يغيّر قواعد قالب «${TEMPLATES[doc.templateId].name}» لتناسب مستوى الطالبات.`}>
        <Segmented
          label="مستوى التحدي"
          value={s.difficulty}
          onChange={(v) => set('difficulty', v)}
          options={[
            { value: 'easy', label: 'سهل' },
            { value: 'medium', label: 'متوسط' },
            { value: 'hard', label: 'متقدم' },
          ]}
        />
        <p className="setting-note">{DIFFICULTY_RULES[doc.templateId][s.difficulty]}</p>
      </SettingCard>

      <SettingCard icon="list" title="عدد الأسئلة وترتيبها" description="اختاري جزءًا من الأسئلة لكل جولة لتختلف الجولات عند إعادة اللعب.">
        <Field label="عدد الأسئلة في الجولة">
          {(id) => (
            <select id={id} className="input" value={s.questionCount} onChange={(e) => set('questionCount', Number(e.target.value))}>
              <option value={0}>كل الأسئلة ({total})</option>
              {countOptions.map((n) => (
                <option key={n} value={n}>
                  {n} أسئلة مختارة عشوائيًا
                </option>
              ))}
              {s.questionCount > 0 && !countOptions.includes(s.questionCount) && <option value={s.questionCount}>{s.questionCount} أسئلة</option>}
            </select>
          )}
        </Field>
        <Segmented
          label="ترتيب الأسئلة"
          value={s.order}
          onChange={(v) => set('order', v)}
          options={[
            { value: 'fixed', label: 'حسب ترتيبي' },
            { value: 'random', label: 'ترتيب عشوائي' },
          ]}
        />
        <Toggle checked={s.shuffleOptions} onChange={(v) => set('shuffleOptions', v)} label="خلط ترتيب الخيارات" description="يمنع حفظ موضع الإجابة الصحيحة بين الطالبات." />
      </SettingCard>

      <SettingCard icon="refresh" title="المحاولات" description="كم مرة تحاول الطالبة في السؤال الواحد قبل أن تُعرض لها الإجابة.">
        <Segmented
          label="المحاولات لكل سؤال"
          value={s.triesPerQuestion}
          onChange={(v) => set('triesPerQuestion', v)}
          options={[
            { value: 1, label: 'محاولة واحدة' },
            { value: 2, label: 'محاولتان' },
            { value: 3, label: '٣ محاولات' },
          ]}
        />
        <Toggle checked={s.allowReplay} onChange={(v) => set('allowReplay', v)} label="السماح بإعادة اللعب" description="يظهر زر «العبي مرة أخرى» في الشاشة الختامية." />
      </SettingCard>

      <SettingCard icon="star" title="النقاط" description="الإجابة من المحاولة الأولى تأخذ النقاط كاملة، ومن محاولة لاحقة نصفها.">
        <Segmented
          label="نقاط كل سؤال"
          value={s.pointsPerQuestion}
          onChange={(v) => set('pointsPerQuestion', v)}
          options={[
            { value: 5, label: '٥ نقاط' },
            { value: 10, label: '١٠ نقاط' },
            { value: 20, label: '٢٠ نقطة' },
          ]}
        />
      </SettingCard>

      <SettingCard icon="bulb" title="التلميحات" description="تظهر التلميحات فقط للأسئلة التي كتبتِ لها تلميحًا.">
        <Segmented
          label="التلميحات"
          value={s.hints}
          onChange={(v) => set('hints', v)}
          options={[
            { value: 'free', label: 'متاحة مجانًا' },
            { value: 'penalty', label: 'متاحة بخصم ربع النقاط' },
            { value: 'off', label: 'معطّلة' },
          ]}
        />
      </SettingCard>

      <SettingCard icon="clock" title="مدة اللعب" description="عند انتهاء الوقت تنتقل الطالبة إلى شاشة النتيجة بما أنجزته.">
        <Toggle checked={s.timerEnabled} onChange={(v) => set('timerEnabled', v)} label="تفعيل المؤقت" />
        {s.timerEnabled && (
          <Field label="المدة بالدقائق">
            {(id) => (
              <select id={id} className="input" value={s.timerMinutes} onChange={(e) => set('timerMinutes', Number(e.target.value))}>
                {[3, 5, 7, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} دقائق
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
      </SettingCard>

      <SettingCard icon="info" title="التغذية الراجعة" description="ما تراه الطالبة بعد كل إجابة. الرسائل الافتراضية مشجّعة ولا تُحرج الطالبة.">
        <Toggle checked={s.showExplanation} onChange={(v) => set('showExplanation', v)} label="عرض تفسير الإجابة" description="يظهر التفسير الذي كتبتِه بعد الإجابة." />
        <Toggle checked={s.showCorrectAnswer} onChange={(v) => set('showCorrectAnswer', v)} label="عرض الإجابة الصحيحة بعد انتهاء المحاولات" />
        <div className="row-2">
          <Field label="رسالة الإجابة الصحيحة" optional hint="اتركيها فارغة لرسائل متنوعة تلقائية.">
            {(id, d) => <input id={id} aria-describedby={d} className="input" maxLength={120} value={s.correctMessage} onChange={(e) => set('correctMessage', e.target.value)} placeholder="مثال: ممتاز يا بطلة!" />}
          </Field>
          <Field label="رسالة الإجابة غير الصحيحة" optional hint="اتركيها فارغة لرسائل متنوعة تلقائية.">
            {(id, d) => <input id={id} aria-describedby={d} className="input" maxLength={120} value={s.wrongMessage} onChange={(e) => set('wrongMessage', e.target.value)} placeholder="مثال: لا بأس، فكّري مرة أخرى" />}
          </Field>
        </div>
        <Toggle checked={s.sound} onChange={(v) => set('sound', v)} label="المؤثرات الصوتية" description="أصوات هادئة وقصيرة، وتستطيع الطالبة كتمها أثناء اللعب." />
      </SettingCard>

      <SettingCard icon="chart" title="تسجيل النتائج" description="اختياري. عند تفعيله تُحفظ نتيجة كل محاولة في حسابكِ لتظهر في صفحة النتائج.">
        <Toggle checked={s.recordResults} onChange={(v) => set('recordResults', v)} label="تسجيل نتائج الطالبات" />
        {s.recordResults && (
          <Toggle
            checked={s.askPlayerName}
            onChange={(v) => set('askPlayerName', v)}
            label="طلب الاسم الأول أو رمز الطالبة"
            description="نطلب اسمًا أول أو رمزًا تحدّدينه (مثل رقم الطالبة في الكشف) فقط. عند إيقافه تُسجّل النتائج دون أسماء."
          />
        )}
        {s.recordResults && <p className="setting-note">يُطبّق التغيير على الطالبات بعد نشر التعديلات.</p>}
      </SettingCard>
    </div>
  );
}
