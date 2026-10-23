import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.ts';
import { useAuth } from '../auth.tsx';
import { TopBar } from '../ui/TopBar.tsx';
import { EmptyState, Modal, Spinner, copyText, formatDate, useFeedback } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import { TemplateArt } from '../ui/TemplateArt.tsx';
import { TEMPLATES } from '../../../shared/catalog.ts';
import type { GameRecord, GameStatus, GameSummary } from '../../../shared/schema.ts';

export const STATUS_LABEL: Record<GameStatus, string> = {
  draft: 'مسودة',
  live: 'منشورة',
  changed: 'منشورة · تعديلات غير منشورة',
  paused: 'النشر موقوف',
};

export const shareUrl = (id: string) => `${window.location.origin}/play/${id}`;

export function NewGameModal({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState<string | null>(null);
  const create = async (start: 'blank' | 'science' | 'math') => {
    setBusy(start);
    try {
      const { game } = await api<{ game: GameRecord }>('/games', { body: { start } });
      nav(`/games/${game.id}/edit/info`);
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(null);
    }
  };
  const options = [
    { start: 'blank' as const, icon: 'plus' as const, title: 'لعبة فارغة', text: 'ابدئي من الصفر بأسئلة درسكِ.' },
    { start: 'science' as const, icon: 'sparkles' as const, title: 'مثال العلوم: أجزاء النبات', text: 'قالب «مغامرة جمع النجوم» بستة أسئلة جاهزة للتعديل.' },
    { start: 'math' as const, icon: 'sparkles' as const, title: 'مثال الرياضيات: الكسور', text: 'قالب «المتاهة التعليمية» بستة أسئلة جاهزة للتعديل.' },
  ];
  return (
    <Modal title="إنشاء لعبة جديدة" onClose={onClose}>
      <p className="muted">اختاري نقطة البداية. يمكنكِ تغيير كل شيء لاحقًا: القالب والأسئلة والإعدادات.</p>
      <div className="start-options">
        {options.map((o) => (
          <button key={o.start} className="start-option" onClick={() => create(o.start)} disabled={!!busy}>
            <span className="start-icon">
              <Icon name={o.icon} />
            </span>
            <span>
              <b>{o.title}</b>
              <small>{o.text}</small>
            </span>
            {busy === o.start ? <span className="spinner small" /> : <Icon name="chevronLeft" />}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const nav = useNavigate();
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  const load = () =>
    api<{ games: GameSummary[] }>('/games')
      .then((r) => setGames(r.games))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menu]);

  const duplicate = async (g: GameSummary) => {
    try {
      const { game } = await api<{ game: GameRecord }>(`/games/${g.id}/duplicate`, { method: 'POST' });
      toast('أُنشئت نسخة جديدة كمسودة.');
      nav(`/games/${game.id}/edit/info`);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  const remove = async (g: GameSummary) => {
    const ok = await confirm({
      title: 'حذف اللعبة',
      message: (
        <>
          <p>
            هل تريدين حذف «{g.title || 'لعبة بلا اسم'}» نهائيًا؟ سيتوقف رابطها عن العمل
            {g.attemptCount ? ` وستُحذف نتائجها المسجّلة (${g.attemptCount} محاولة)` : ''}.
          </p>
          <p className="muted">لا يمكن التراجع عن هذه العملية.</p>
        </>
      ),
      confirmLabel: 'نعم، احذفي اللعبة',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/games/${g.id}`, { method: 'DELETE' });
      setGames((gs) => gs?.filter((x) => x.id !== g.id) ?? null);
      toast('حُذفت اللعبة.');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  const copyLink = async (g: GameSummary) => {
    (await copyText(shareUrl(g.id))) ? toast('نُسخ رابط اللعبة.') : toast('تعذّر النسخ، انسخي الرابط من صفحة النشر.', 'error');
  };

  return (
    <div className="page">
      <TopBar />
      <main className="container">
        <div className="page-head">
          <div>
            <h1>أهلًا {user?.name.split(' ')[0]}</h1>
            <p className="muted">ألعابكِ محفوظة في حسابكِ، وتستطيعين فتحها من أي جهاز.</p>
          </div>
          <button className="btn primary lg" onClick={() => setCreating(true)}>
            <Icon name="plus" /> لعبة جديدة
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {!games && !error && <Spinner />}
        {games && games.length === 0 && (
          <EmptyState icon="sparkles" title="لا توجد ألعاب بعد">
            <p>ابدئي بلعبة فارغة أو من أحد المثالين الجاهزين في العلوم والرياضيات.</p>
            <button className="btn primary" onClick={() => setCreating(true)}>
              <Icon name="plus" /> أنشئي أول لعبة
            </button>
          </EmptyState>
        )}
        {games && games.length > 0 && (
          <div className="game-grid">
            {games.map((g) => (
              <article key={g.id} className="game-card">
                <Link to={`/games/${g.id}/edit/info`} className="game-card-art" tabIndex={-1} aria-hidden>
                  <TemplateArt id={g.templateId} theme={g.theme} />
                </Link>
                <div className="game-card-body">
                  <span className={`status-pill ${g.status}`}>{STATUS_LABEL[g.status]}</span>
                  <h2>
                    <Link to={`/games/${g.id}/edit/info`}>{g.title || 'لعبة بلا اسم'}</Link>
                  </h2>
                  <p className="muted small">{[g.subject, g.grade].filter(Boolean).join(' · ') || 'لم تُحدَّد المادة والصف بعد'}</p>
                  <ul className="game-facts">
                    <li>
                      <Icon name="grid" size={15} /> {TEMPLATES[g.templateId].name}
                    </li>
                    <li>
                      <Icon name="list" size={15} /> {g.questionCount} سؤال
                    </li>
                    {g.attemptCount > 0 && (
                      <li>
                        <Icon name="chart" size={15} /> {g.attemptCount} محاولة
                      </li>
                    )}
                  </ul>
                  <p className="muted tiny">آخر تعديل: {formatDate(g.updatedAt)}</p>
                </div>
                <footer className="game-card-actions">
                  <Link className="btn small primary" to={`/games/${g.id}/edit/info`}>
                    <Icon name="edit" size={16} /> تعديل
                  </Link>
                  {g.status === 'live' || g.status === 'changed' ? (
                    <button className="btn small ghost" onClick={() => copyLink(g)}>
                      <Icon name="link" size={16} /> نسخ الرابط
                    </button>
                  ) : null}
                  <Link className="btn small ghost" to={`/games/${g.id}/results`}>
                    <Icon name="chart" size={16} /> النتائج
                  </Link>
                  <div className="menu-wrap">
                    <button
                      className="icon-btn"
                      aria-label="خيارات أخرى"
                      aria-expanded={menu === g.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenu(menu === g.id ? null : g.id);
                      }}
                    >
                      <Icon name="more" />
                    </button>
                    {menu === g.id && (
                      <div className="menu" role="menu">
                        <button role="menuitem" onClick={() => duplicate(g)}>
                          <Icon name="copy" size={16} /> إنشاء نسخة
                        </button>
                        <button role="menuitem" className="danger-text" onClick={() => remove(g)}>
                          <Icon name="trash" size={16} /> حذف
                        </button>
                      </div>
                    )}
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>
      {creating && <NewGameModal onClose={() => setCreating(false)} />}
    </div>
  );
}
