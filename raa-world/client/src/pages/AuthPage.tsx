import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api.ts';
import { useAuth } from '../auth.tsx';
import { Field, Logo } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { BRAND } from '../brand.ts';
import type { PublicUser } from '../../../shared/schema.ts';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [form, setForm] = useState({ name: '', email: '', password: '', activationCode: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);

  useEffect(() => {
    if (mode === 'register') api<{ requireActivationCode: boolean }>('/config').then((c) => setNeedsCode(c.requireActivationCode)).catch(() => {});
  }, [mode]);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : { ...form, activationCode: needsCode ? form.activationCode : undefined };
      const r = await api<{ user: PublicUser }>(`/auth/${mode}`, { body });
      setUser(r.user);
      nav(next.startsWith('/') ? next : '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-logo">
          <Logo />
        </Link>
        <h1>{BRAND.slogan}</h1>
        <ul>
          <li><Icon name="sparkles" /> قوالب لعب جاهزة ومختلفة فعلًا</li>
          <li><Icon name="list" /> أسئلتكِ أنتِ، لأي مادة وأي صف</li>
          <li><Icon name="link" /> رابط واحد تشاركينه مع طالباتكِ</li>
          <li><Icon name="chart" /> نتائج اختيارية تحترم خصوصية الطالبات</li>
        </ul>
      </aside>
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب معلمة'}</h2>
          <p className="muted">{mode === 'login' ? 'ادخلي إلى ألعابكِ من أي جهاز.' : 'حساب واحد يحفظ كل ألعابكِ ونتائج طالباتكِ.'}</p>
          {mode === 'register' && (
            <Field label="الاسم">
              {(id) => <input id={id} className="input" value={form.name} onChange={set('name')} placeholder="مثال: أ. نورة الحربي" autoComplete="name" required />}
            </Field>
          )}
          <Field label="البريد الإلكتروني">
            {(id) => <input id={id} className="input ltr" type="email" value={form.email} onChange={set('email')} placeholder="name@school.edu.sa" autoComplete="email" required />}
          </Field>
          <Field label="كلمة المرور" hint={mode === 'register' ? '٨ أحرف على الأقل.' : undefined}>
            {(id, d) => (
              <input id={id} aria-describedby={d} className="input ltr" type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
            )}
          </Field>
          {mode === 'register' && needsCode && (
            <Field label="رمز التفعيل" hint="ستجدينه في رسالة تأكيد الشراء.">
              {(id, d) => <input id={id} aria-describedby={d} className="input ltr" value={form.activationCode} onChange={set('activationCode')} placeholder="RAA-XXXX-XXXX-XXXX" required />}
            </Field>
          )}
          {error && (
            <div className="alert error" role="alert">
              <Icon name="warn" size={18} /> {error}
            </div>
          )}
          <button className="btn primary block lg" disabled={busy}>
            {busy ? 'لحظة…' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </button>
          <p className="auth-switch">
            {mode === 'login' ? (
              <>ليس لديكِ حساب؟ <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>أنشئي حسابًا</Link></>
            ) : (
              <>لديكِ حساب؟ <Link to="/login">سجّلي الدخول</Link></>
            )}
          </p>
          {mode === 'login' && <p className="muted small">نسيتِ كلمة المرور؟ تواصلي مع دعم {BRAND.platform} لإعادة تعيينها.</p>}
        </form>
      </main>
    </div>
  );
}
