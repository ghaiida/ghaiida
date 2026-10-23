import { Link } from 'react-router-dom';
import { useAuth } from '../auth.tsx';
import { LOCAL } from '../api.ts';
import { Icon } from './Icon.tsx';
import { Logo } from './kit.tsx';

export function TopBar({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <>
    {LOCAL && <TrialNote />}
    <header className="topbar">
      <Link to={user ? '/dashboard' : '/'} className="topbar-brand" aria-label="الصفحة الرئيسة">
        <Logo />
      </Link>
      <div className="topbar-middle">{children}</div>
      {user && (
        <div className="topbar-user">
          <span className="avatar" aria-hidden>
            {user.name.trim()[0]}
          </span>
          <span className="topbar-name">{user.name}</span>
          <button className="icon-btn" onClick={logout} title="تسجيل الخروج" aria-label="تسجيل الخروج">
            <Icon name="logout" />
          </button>
        </div>
      )}
    </header>
    </>
  );
}

export function TrialNote() {
  return (
    <p className="trial-note">
      <Icon name="info" size={16} /> نسخة تجريبية: الألعاب والنتائج محفوظة في متصفح هذا الجهاز فقط، ورابط المشاركة لا يفتح على أجهزة أخرى.
    </p>
  );
}
