// Class results for one game: summary, hardest questions, concepts to review, attempts, CSV.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, LOCAL } from '../api.ts';
import { TopBar } from '../ui/TopBar.tsx';
import { EmptyState, Spinner, formatDuration, useFeedback } from '../ui/kit.tsx';
import { Icon } from '../ui/Icon.tsx';
import type { ResultsStats } from '../../../shared/stats.ts';
import type { GameRecord } from '../../../shared/schema.ts';

interface AttemptSummary {
  id: string;
  player: string;
  version: number;
  outcome: 'completed' | 'timeout';
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  durationSec: number;
  createdAt: string;
}

const pct = (r: number) => `${Math.round(r * 100)}%`;

function Bar({ value }: { value: number }) {
  const tone = value < 0.5 ? 'low' : value < 0.75 ? 'mid' : 'high';
  return (
    <span className={`rate-bar ${tone}`} aria-hidden>
      <i style={{ width: `${Math.max(value * 100, 2)}%` }} />
    </span>
  );
}

export default function ResultsPage() {
  const { id = '' } = useParams();
  const { toast, confirm } = useFeedback();
  const [game, setGame] = useState<GameRecord | null>(null);
  const [data, setData] = useState<{ stats: ResultsStats; attempts: AttemptSummary[]; recording: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    Promise.all([api<{ game: GameRecord }>(`/games/${id}`), api<{ stats: ResultsStats; attempts: AttemptSummary[]; recording: boolean }>(`/games/${id}/results`)])
      .then(([g, r]) => {
        setGame(g.game);
        setData(r);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const clear = async () => {
    const ok = await confirm({
      title: 'حذف كل النتائج',
      message: <p>ستُحذف كل المحاولات المسجّلة لهذه اللعبة نهائيًا. تبقى اللعبة وأسئلتها كما هي.</p>,
      confirmLabel: 'حذف النتائج',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/games/${id}/results`, { method: 'DELETE' });
      toast('حُذفت النتائج.');
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const s = data?.stats;
  return (
    <div className="page">
      <TopBar>
        <div className="editor-title">
          <Link to="/dashboard" className="crumb">
            <Icon name="chevronRight" size={16} /> ألعابي
          </Link>
          {game && <strong>{game.draft.meta.title || 'لعبة بلا اسم'}</strong>}
        </div>
      </TopBar>
      <main className="container">
        <div className="page-head">
          <div>
            <h1>نتائج الطالبات</h1>
            {game && <p className="muted">{game.draft.meta.title}</p>}
          </div>
          <div className="btn-row">
            <Link className="btn ghost" to={`/games/${id}/edit/info`}>
              <Icon name="edit" /> تعديل اللعبة
            </Link>
            {s && s.attemptCount > 0 && (
              <>
                {!LOCAL && <a className="btn primary" href={`/api/games/${id}/results.csv`} download>
                  <Icon name="download" /> تصدير إلى Excel (CSV)
                </a>}
                <button className="btn ghost danger-text" onClick={clear}>
                  <Icon name="trash" /> حذف النتائج
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}
        {!data && !error && <Spinner />}

        {data && game && !data.recording && (
          <div className="alert info">
            <Icon name="info" size={18} />
            <span>
              تسجيل النتائج غير مفعّل في النسخة المنشورة، لذلك لا تُحفظ محاولات الطالبات الآن. فعّليه من{' '}
              <Link to={`/games/${id}/edit/settings`}>إعدادات اللعب</Link> ثم انشري التعديلات.
            </span>
          </div>
        )}

        {s && s.attemptCount === 0 && (
          <EmptyState icon="chart" title="لا توجد محاولات مسجّلة بعد">
            <p>عندما تُنهي الطالبات اللعبة وتسجيل النتائج مفعّل، ستظهر النتائج هنا.</p>
          </EmptyState>
        )}

        {s && data && s.attemptCount > 0 && (
          <>
            <section className="stat-row">
              <div className="stat">
                <span>المحاولات المسجّلة</span>
                <b>{s.attemptCount}</b>
              </div>
              <div className="stat">
                <span>متوسط الدرجات</span>
                <b>{s.averagePercent}%</b>
              </div>
              <div className="stat">
                <span>نسبة الإجابات الصحيحة</span>
                <b>{pct(s.correctRate)}</b>
              </div>
              <div className="stat">
                <span>متوسط مدة اللعب</span>
                <b>{formatDuration(s.averageDurationSec)}</b>
              </div>
            </section>

            <div className="results-grid">
              <section className="panel">
                <h2 className="panel-title">
                  <Icon name="target" size={18} /> الأسئلة الأكثر صعوبة
                </h2>
                <p className="muted small">مرتبة من الأقل في نسبة الإجابة الصحيحة.</p>
                <ol className="hard-list">
                  {s.questions.slice(0, 8).map((q) => (
                    <li key={q.qid}>
                      <p>{q.prompt}</p>
                      <div className="rate-line">
                        <Bar value={q.correctRate} />
                        <b>{pct(q.correctRate)}</b>
                        <span className="muted tiny">
                          من المحاولة الأولى {pct(q.firstTryRate)} · {q.answered} إجابة
                          {q.hintRate > 0 ? ` · استخدمت التلميح ${pct(q.hintRate)}` : ''}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="panel">
                <h2 className="panel-title">
                  <Icon name="book" size={18} /> المفاهيم التي تحتاج إلى مراجعة
                </h2>
                {s.concepts.length === 0 ? (
                  <p className="muted">اربطي الأسئلة بمفاهيم (من خانة «المفهوم أو المهارة» في محرر السؤال) ليظهر هنا تحليل لكل مهارة.</p>
                ) : (
                  <ul className="concept-list">
                    {s.concepts.map((c) => (
                      <li key={c.concept}>
                        <span>{c.concept}</span>
                        <Bar value={c.correctRate} />
                        <b>{pct(c.correctRate)}</b>
                        {c.correctRate < 0.6 && <span className="review-tag">تحتاج إلى مراجعة</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="panel">
              <h2 className="panel-title">
                <Icon name="list" size={18} /> المحاولات
              </h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>الطالبة / الرمز</th>
                      <th>الدرجة</th>
                      <th>الصحيحة</th>
                      <th>المدة</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attempts.map((a) => (
                      <tr key={a.id}>
                        <td>{a.player || <span className="muted">بدون اسم</span>}</td>
                        <td>
                          {a.score}/{a.maxScore} <span className="muted tiny">({a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0}%)</span>
                        </td>
                        <td>
                          {a.correct}/{a.total}
                        </td>
                        <td>{formatDuration(a.durationSec)}</td>
                        <td>{a.outcome === 'completed' ? 'مكتملة' : 'انتهى الوقت'}</td>
                        <td className="nowrap">{new Date(a.createdAt).toLocaleString('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
