// The student experience: welcome → template play → results. Template-agnostic: it owns the
// round, timer, scoring, the question sheet and result submission; templates only decide
// how the adventure looks and in which order questions are asked.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import '../styles/player.css';
import { Link } from 'react-router-dom';
import { api, assetUrl } from '../api.ts';
import { Icon, StarShape } from '../ui/Icon.tsx';
import { formatDuration } from '../ui/kit.tsx';
import { createRng, correctAnswerText, pointsFor, prepareRound, summarize, type PlayQuestion } from '../../../shared/engine.ts';
import { TEMPLATES, THEMES } from '../../../shared/catalog.ts';
import type { AnswerRecord, GameDoc } from '../../../shared/schema.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { createSfx } from './sound.ts';
import { words } from './words.ts';
import { StarsAdventure } from './templates/StarsAdventure.tsx';
import { MazeQuest } from './templates/MazeQuest.tsx';
import { GatesChallenge } from './templates/GatesChallenge.tsx';
import type { AskOptions, AskResult, TemplateProps } from './types.ts';
import { BRAND } from '../brand.ts';

const TEMPLATE_COMPONENTS = {
  stars: StarsAdventure,
  maze: MazeQuest,
  gates: GatesChallenge,
} satisfies Record<GameDoc['templateId'], React.ComponentType<TemplateProps>>;

type Mode = 'live' | 'preview' | 'demo';
type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export function GamePlayer({ doc, mode, gameId, version, onExit }: { doc: GameDoc; mode: Mode; gameId?: string; version?: number; onExit?: () => void }) {
  const w = words(doc.settings.address);
  const theme = THEMES[doc.settings.theme];
  const recording = mode === 'live' && doc.settings.recordResults;
  const askName = doc.settings.recordResults && doc.settings.askPlayerName && mode !== 'demo';

  const [phase, setPhase] = useState<'welcome' | 'playing' | 'done'>('welcome');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const round = useMemo(() => prepareRound(doc, createRng(seed)), [doc, seed]);
  const [records, setRecords] = useState<Record<string, AnswerRecord>>({});
  const [active, setActive] = useState<{ pq: PlayQuestion; opts: AskOptions; resolve: (r: AskResult) => void } | null>(null);
  const [player, setPlayer] = useState('');
  const [nameError, setNameError] = useState(false);
  const [outcome, setOutcome] = useState<{ reason: 'completed' | 'timeout'; achievement: string; durationSec: number } | null>(null);
  const [submit, setSubmit] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState('');
  const [timeLeft, setTimeLeft] = useState(doc.settings.timerMinutes * 60);
  const [muted, setMuted] = useState(!doc.settings.sound);
  const sfx = useMemo(() => createSfx(!doc.settings.sound), [doc.settings.sound]);
  const startedAt = useRef(0);
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const reducedMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const ask = useCallback(
    (pq: PlayQuestion, opts: AskOptions) =>
      new Promise<AskResult>((resolve) => {
        setActive({ pq, opts, resolve });
      }),
    [],
  );

  const finishAnswer = (r: AskResult) => {
    if (!active) return;
    const { pq, opts, resolve } = active;
    // Only the first time a question is met counts toward the score and the teacher's report;
    // practice rounds and gate resets are for learning.
    if (!opts.practice && !recordsRef.current[pq.q.id]) {
      const rec: AnswerRecord = { qid: pq.q.id, correct: r.correct, tries: r.tries, usedHint: r.usedHint };
      setRecords((prev) => ({ ...prev, [pq.q.id]: rec }));
    }
    setActive(null);
    resolve(r);
  };

  const finish = useCallback(
    (reason: 'completed' | 'timeout', achievement = '') => {
      setActive(null);
      setOutcome({ reason, achievement, durationSec: Math.round((Date.now() - startedAt.current) / 1000) });
      setPhase('done');
      if (reason === 'completed') sfx.win();
    },
    [sfx],
  );

  // Countdown timer.
  useEffect(() => {
    if (phase !== 'playing' || !doc.settings.timerEnabled) return;
    const t = window.setInterval(() => {
      const left = doc.settings.timerMinutes * 60 - Math.floor((Date.now() - startedAt.current) / 1000);
      setTimeLeft(Math.max(left, 0));
      if (left <= 0) finish('timeout');
    }, 500);
    return () => window.clearInterval(t);
  }, [phase, doc.settings.timerEnabled, doc.settings.timerMinutes, finish]);

  const answers = useMemo(() => round.map((p) => records[p.q.id]).filter(Boolean), [round, records]);
  const summary = summarize(doc.settings, answers, round.length);
  const score = answers.reduce((s, a) => s + pointsFor(doc.settings, a), 0);

  const sendResult = useCallback(async () => {
    if (!recording || !gameId || !outcome) return;
    setSubmit('sending');
    try {
      await api(`/play/${gameId}/attempts`, {
        body: { version: version ?? 1, player: player.trim(), outcome: outcome.reason, durationSec: outcome.durationSec, answers },
      });
      setSubmit('sent');
    } catch (e) {
      setSubmit('error');
      setSubmitError((e as Error).message);
    }
  }, [recording, gameId, outcome, version, player, answers]);

  useEffect(() => {
    if (phase === 'done' && submit === 'idle' && recording) void sendResult();
  }, [phase, submit, recording, sendResult]);

  const start = () => {
    if (askName && mode === 'live' && !player.trim()) {
      setNameError(true);
      return;
    }
    sfx.setMuted(muted);
    sfx.unlock();
    startedAt.current = Date.now();
    setTimeLeft(doc.settings.timerMinutes * 60);
    setPhase('playing');
  };
  const replay = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setRecords({});
    setOutcome(null);
    setSubmit('idle');
    setActive(null);
    startedAt.current = Date.now();
    setTimeLeft(doc.settings.timerMinutes * 60);
    setPhase('playing');
  };

  const style = {
    '--p': theme.primary,
    '--pd': theme.primaryDark,
    '--acc': theme.accent,
    '--soft': theme.soft,
    '--sky': theme.sky,
    '--ground': theme.ground,
    '--ink': theme.ink,
    '--surface': theme.surface,
  } as CSSProperties;
  const Template = TEMPLATE_COMPONENTS[doc.templateId];
  const m = doc.meta;

  return (
    <div className={`player theme-${theme.id}${theme.dark ? ' dark' : ''}${reducedMotion ? ' reduced' : ''}`} style={style} dir="rtl">
      {mode === 'preview' && (
        <div className="preview-banner">
          <Icon name="eye" size={16} /> وضع المعاينة — تجربة اللعبة كما تراها الطالبة، ولا تُسجّل النتائج.
          <button className="pbtn tiny" onClick={onExit}>
            <Icon name="x" size={16} /> العودة إلى التعديل
          </button>
        </div>
      )}
      {mode === 'demo' && (
        <div className="preview-banner demo">
          <Icon name="sparkles" size={16} /> لعبة تجريبية من {BRAND.product}. أنشئي حسابًا لتصنعي لعبة بأسئلتكِ.
          <Link className="pbtn tiny" to="/register">
            أنشئي حسابًا
          </Link>
        </div>
      )}

      {phase === 'welcome' && (
        <main className="welcome">
          <div className="welcome-card">
            {m.coverId && <img className="welcome-cover" src={assetUrl(m.coverId)} alt="" />}
            <div className="welcome-body">
              <div className="welcome-school">
                {m.logoId && <img src={assetUrl(m.logoId)} alt="شعار المدرسة" />}
                {(m.schoolName || m.teacherName) && <span>{[m.teacherName, m.schoolName].filter(Boolean).join(' · ')}</span>}
              </div>
              <span className="welcome-template">{TEMPLATES[doc.templateId].name}</span>
              <h1>{m.title || 'لعبة بلا اسم'}</h1>
              <p className="welcome-meta">{[m.subject.trim(), m.grade.trim(), m.lesson.trim()].filter(Boolean).join(' · ')}</p>
              {m.description && <p className="welcome-desc">{m.description}</p>}
              {doc.settings.welcomeMessage && <p className="welcome-msg">{doc.settings.welcomeMessage}</p>}
              <ul className="how">
                {w.instructions[doc.templateId].map((h, i) => (
                  <li key={i}>
                    <span>{i + 1}</span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="welcome-facts">
                <span>
                  <Icon name="list" size={16} /> {round.length} سؤال
                </span>
                {doc.settings.timerEnabled && (
                  <span>
                    <Icon name="clock" size={16} /> {doc.settings.timerMinutes} دقائق
                  </span>
                )}
                <span>
                  <Icon name="refresh" size={16} /> {doc.settings.triesPerQuestion === 1 ? 'محاولة واحدة لكل سؤال' : `${doc.settings.triesPerQuestion} محاولات لكل سؤال`}
                </span>
              </div>
              {askName && (
                <div className="name-field">
                  <label htmlFor="player-name">{w.nameLabel}</label>
                  <input
                    id="player-name"
                    value={player}
                    maxLength={40}
                    onChange={(e) => {
                      setPlayer(e.target.value);
                      setNameError(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && start()}
                    autoComplete="off"
                    aria-describedby="player-name-help"
                  />
                  <p id="player-name-help" className={nameError ? 'err' : ''}>
                    {nameError ? w.nameRequired : w.namePrivacy}
                  </p>
                </div>
              )}
              <button className="pbtn primary xl" onClick={start}>
                <Icon name="play" /> {w.start}
              </button>
            </div>
          </div>
        </main>
      )}

      {phase === 'playing' && (
        <>
          <header className="hud">
            <span className="hud-title">{m.title}</span>
            <div className="hud-progress" aria-label={`أُجيب ${answers.length} من ${round.length}`}>
              <div className="bar">
                <i style={{ width: `${(answers.length / Math.max(round.length, 1)) * 100}%` }} />
              </div>
              <span>
                {answers.length}/{round.length}
              </span>
            </div>
            <span className="hud-chip score" aria-label={`النقاط ${score}`}>
              <StarShape size={18} /> {score}
            </span>
            {doc.settings.timerEnabled && (
              <span className={`hud-chip timer${timeLeft <= 30 ? ' low' : ''}`} aria-label="الوقت المتبقي">
                <Icon name="clock" size={16} /> {formatDuration(timeLeft)}
              </span>
            )}
            <button
              className="hud-icon"
              onClick={() => {
                sfx.setMuted(!muted);
                setMuted(!muted);
              }}
              aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              aria-pressed={muted}
            >
              <Icon name={muted ? 'mute' : 'volume'} size={18} />
            </button>
          </header>
          <div className="stage">
            <Template key={seed} round={round} doc={doc} ask={ask} sfx={sfx} reducedMotion={reducedMotion} words={w} onComplete={(a) => finish('completed', a)} />
          </div>
          {active && <QuestionCard key={`${active.pq.q.id}-${active.opts.label}`} pq={active.pq} opts={active.opts} settings={doc.settings} words={w} sfx={sfx} onDone={finishAnswer} />}
        </>
      )}

      {phase === 'done' && outcome && (
        <main className="finish">
          <div className="finish-card">
            <div className="finish-stars" aria-label={`${summary.stars} من ٣ نجوم`}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`fstar s${n}${summary.stars >= n ? ' on' : ''}`}>
                  <StarShape size={58} filled={summary.stars >= n} />
                </span>
              ))}
            </div>
            <h1>{outcome.reason === 'timeout' ? w.timeUp : summary.percent >= 60 ? w.g('مغامرة رائعة!', 'مغامرة رائعة!') : w.g('أنهيتِ المغامرة!', 'أنهيت المغامرة!')}</h1>
            <p className="finish-msg">{outcome.reason === 'timeout' ? w.timeUpText : doc.settings.completionMessage}</p>
            {outcome.achievement && (
              <p className="achievement">
                <Icon name="sparkles" size={18} /> {outcome.achievement}
              </p>
            )}
            <dl className="finish-stats">
              <div>
                <dt>النقاط</dt>
                <dd>
                  {summary.score}
                  <small>/{summary.maxScore}</small>
                </dd>
              </div>
              <div>
                <dt>إجابات صحيحة</dt>
                <dd>
                  {summary.correct}
                  <small>/{summary.total}</small>
                </dd>
              </div>
              <div>
                <dt>الوقت</dt>
                <dd>{formatDuration(outcome.durationSec)}</dd>
              </div>
            </dl>

            {recording && (
              <div className={`submit-state ${submit}`} role="status">
                {submit === 'sending' && (
                  <>
                    <span className="spinner small" /> جارٍ إرسال النتيجة…
                  </>
                )}
                {submit === 'sent' && (
                  <>
                    <Icon name="check" size={18} /> {w.g('وصلت نتيجتكِ إلى معلمتكِ.', 'وصلت نتيجتك إلى معلمك.')}
                  </>
                )}
                {submit === 'error' && (
                  <>
                    <Icon name="warn" size={18} /> لم تُرسل النتيجة: {submitError}
                    <button className="pbtn tiny" onClick={sendResult}>
                      إعادة الإرسال
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="finish-actions">
              {doc.settings.allowReplay && (
                <button className="pbtn primary lg" onClick={replay} disabled={submit === 'sending'}>
                  <Icon name="refresh" /> {w.playAgain}
                </button>
              )}
              {mode === 'preview' && (
                <button className="pbtn lg" onClick={onExit}>
                  العودة إلى التعديل
                </button>
              )}
            </div>

            {doc.settings.showCorrectAnswer && (
              <details className="review">
                <summary>مراجعة الإجابات</summary>
                <ol>
                  {round.map((p) => {
                    const r = records[p.q.id];
                    return (
                      <li key={p.q.id} className={r ? (r.correct ? 'ok' : 'no') : 'skip'}>
                        <span className="review-mark" aria-hidden>
                          <Icon name={r ? (r.correct ? 'check' : 'x') : 'more'} size={16} />
                        </span>
                        <div>
                          <p>{p.q.prompt}</p>
                          <p className="review-answer">
                            الإجابة الصحيحة: <b>{correctAnswerText(p.q)}</b>
                          </p>
                          {doc.settings.showExplanation && p.q.explanation && <p className="review-exp">{p.q.explanation}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </details>
            )}
          </div>
        </main>
      )}
      <footer className="player-brand">
        {BRAND.product} · {BRAND.platform}
      </footer>
    </div>
  );
}
