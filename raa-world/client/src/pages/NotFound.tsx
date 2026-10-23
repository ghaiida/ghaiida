import { Link } from 'react-router-dom';
import { Logo, EmptyState } from '../ui/kit.tsx';

export function NotFound() {
  return (
    <div className="center-page">
      <Logo />
      <EmptyState icon="map" title="الصفحة غير موجودة">
        <p>ربما تغيّر الرابط أو كُتب بشكل غير صحيح.</p>
        <Link className="btn primary" to="/">
          العودة إلى الصفحة الرئيسة
        </Link>
      </EmptyState>
    </div>
  );
}
