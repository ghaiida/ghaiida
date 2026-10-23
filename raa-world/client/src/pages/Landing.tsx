import { Link } from 'react-router-dom';
import { useAuth } from '../auth.tsx';
import { LOCAL } from '../api.ts';
import { TrialNote } from '../ui/TopBar.tsx';
import { Logo } from '../ui/kit.tsx';
import { Icon, type IconName } from '../ui/Icon.tsx';
import { TemplateArt } from '../ui/TemplateArt.tsx';
import { BRAND } from '../brand.ts';
import { TEMPLATES } from '../../../shared/catalog.ts';
import { TEMPLATE_IDS } from '../../../shared/schema.ts';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'book', title: 'بيانات الدرس', text: 'المادة والصف وعنوان الدرس وأهدافه.' },
  { icon: 'grid', title: 'اختيار القالب', text: 'نجوم أو متاهة أو بوابات، لكل منها طريقة لعب مختلفة.' },
  { icon: 'list', title: 'إضافة الأسئلة', text: 'يدويًا أو باستيراد ملف Excel أو CSV جاهز.' },
  { icon: 'link', title: 'النشر والمشاركة', text: 'رابط ورمز QR تفتحه الطالبة من أي جهاز.' },
];

export function Landing() {
  const { user } = useAuth();
  return (
    <div className="landing">
      {LOCAL && <TrialNote />}
      <header className="landing-top">
        <Logo />
        <nav>
          {user ? (
            <Link className="btn primary" to="/dashboard">
              ألعابي
            </Link>
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                تسجيل الدخول
              </Link>
              <Link className="btn primary" to="/register">
                أنشئي حسابًا
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">
            {BRAND.productLatin} · من {BRAND.platform}
          </span>
          <h1>{BRAND.slogan}</h1>
          <p>
            قالب ألعاب تعليمية ذكي تخصّصينه لأي مادة وأي صف دون برمجة: أضيفي أسئلة درسكِ، واختاري مغامرة، ثم شاركي الرابط مع
            طالباتكِ.
          </p>
          <div className="hero-cta">
            <Link className="btn primary lg" to={user ? '/dashboard' : '/register'}>
              <Icon name="sparkles" /> ابدئي أول لعبة
            </Link>
            <Link className="btn outline lg" to="/demo/science">
              <Icon name="play" /> جرّبي لعبة العلوم
            </Link>
            <Link className="btn outline lg" to="/demo/math">
              <Icon name="play" /> جرّبي لعبة الرياضيات
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="hero-card c1">
            <TemplateArt id="stars" theme="emerald" />
          </div>
          <div className="hero-card c2">
            <TemplateArt id="maze" theme="royal" />
          </div>
          <div className="hero-card c3">
            <TemplateArt id="gates" theme="sand" />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>ثلاثة قوالب، ثلاث طرق لعب مختلفة</h2>
        <div className="template-grid">
          {TEMPLATE_IDS.map((id) => (
            <article key={id} className="template-card static">
              <TemplateArt id={id} theme={id === 'stars' ? 'emerald' : id === 'maze' ? 'royal' : 'sand'} />
              <h3>{TEMPLATES[id].name}</h3>
              <p className="muted">{TEMPLATES[id].tagline}</p>
              <ul>
                {TEMPLATES[id].howToPlay.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>من الدرس إلى اللعبة في أربع خطوات</h2>
        <ol className="steps-row">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-num">{i + 1}</span>
              <Icon name={s.icon} size={22} />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section split">
        <div>
          <h2>مصمّمة للمعلمة… ممتعة للطالبة</h2>
          <ul className="check-list">
            <li>كل لعبة مستقلة بمحتواها وإعداداتها ورابطها.</li>
            <li>تعديلاتكِ تبقى مسودة حتى تنشريها، فلا تتغير اللعبة أثناء استخدام الطالبات لها.</li>
            <li>تلميحات وتفسيرات تعليمية ورسائل تشجيع لا تُحرج الطالبة عند الخطأ.</li>
            <li>تسجيل نتائج اختياري برمز أو اسم أول فقط، مع تقرير بالأسئلة الأصعب والمفاهيم التي تحتاج إلى مراجعة.</li>
            <li>تعمل على الجوال والتابلت والحاسب من المتصفح مباشرة.</li>
          </ul>
        </div>
        <div className="note-card">
          <Icon name="shield" size={26} />
          <h3>خصوصية الطالبات أولًا</h3>
          <p>لا تطلب اللعبة بريدًا ولا رقم جوال ولا اسمًا كاملًا. التسجيل معطّل افتراضيًا، وتفعّله المعلمة عند الحاجة فقط.</p>
        </div>
      </section>

      <footer className="landing-foot">
        <Logo compact />
        <span>
          {BRAND.product} — أحد منتجات {BRAND.platform}
        </span>
      </footer>
    </div>
  );
}
