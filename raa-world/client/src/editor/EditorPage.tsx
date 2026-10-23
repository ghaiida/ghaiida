// The teacher's editor: one game document, edited in steps, autosaved as a draft.
// Publishing copies the saved draft to the version students play.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, LOCAL } from '../api.ts';
import { TopBar } from '../ui/TopBar.tsx';
import { Spinner, useFeedback } from '../ui/kit.tsx';
import { Icon, type IconName } from '../ui/Icon.tsx';
import type { GameDoc, GameRecord } from '../../../shared/schema.ts';
import { publishIssues, type Issue } from '../../../shared/validation.ts';
import { InfoStep } from './InfoStep.tsx';
import { TemplateStep } from './TemplateStep.tsx';
import { QuestionsStep } from './QuestionsStep.tsx';
import { SettingsStep } from './SettingsStep.tsx';
import { LookStep } from './LookStep.tsx';
import { PublishStep } from './PublishStep.tsx';
import { STATUS_LABEL } from '../pages/Dashboard.tsx';
import { GamePlayer } from '../player/GamePlayer.tsx';

export type StepId = 'info' | 'template' | 'questions' | 'settings' | 'look' | 'publish';
const STEPS: { id: StepId; label: string; icon: IconName }[] = [
  { id: 'info', label: 'بيانات اللعبة', icon: 'book' },
  { id: 'template', label: 'قالب اللعب', icon: 'grid' },
  { id: 'questions', label: 'الأسئلة', icon: 'list' },
  { id: 'settings', label: 'إعدادات اللعب', icon: 'settings' },
  { id: 'look', label: 'المظهر والرسائل', icon: 'palette' },
  { id: 'publish', label: 'النشر والمشاركة', icon: 'link' },
];

type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

export interface StepProps {
  doc: GameDoc;
  update: (fn: (d: GameDoc) => void) => void;
}

export default function EditorPage() {
  const { id = '', step = 'info' } = useParams();
  const nav = useNavigate();
  const { toast } = useFeedback();
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [doc, setDoc] = useState<GameDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [serverIssues, setServerIssues] = useState<Issue[] | null>(null);

  // Refs let the autosave loop see the latest values without re-subscribing.
  const docRef = useRef<GameDoc | null>(null);
  const revisionRef = useRef(0);
  const savingRef = useRef<Promise<boolean> | null>(null);
  const dirtyRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const { game } = await api<{ game: GameRecord }>(`/games/${id}`);
      setRecord(game);
      setDoc(game.draft);
      docRef.current = game.draft;
      revisionRef.current = game.revision;
      dirtyRef.current = false;
      setSave('saved');
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const saveNow = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timer.current);
    if (savingRef.current) await savingRef.current;
    if (!dirtyRef.current || !docRef.current) return true;
    const run = (async () => {
      dirtyRef.current = false;
      setSave('saving');
      try {
        const { game } = await api<{ game: GameRecord }>(`/games/${id}/draft`, {
          method: 'PUT',
          body: { draft: docRef.current, revision: revisionRef.current },
        });
        revisionRef.current = game.revision;
        setRecord(game);
        setSave(dirtyRef.current ? 'dirty' : 'saved');
        setSaveError(null);
        return true;
      } catch (e) {
        dirtyRef.current = true;
        const conflict = e instanceof ApiError && e.status === 409;
        setSave(conflict ? 'conflict' : 'error');
        setSaveError((e as Error).message);
        return false;
      }
    })();
    savingRef.current = run;
    const ok = await run;
    savingRef.current = null;
    return ok;
  }, [id]);

  const update = useCallback(
    (fn: (d: GameDoc) => void) => {
      setDoc((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        fn(next);
        docRef.current = next;
        return next;
      });
      dirtyRef.current = true;
      setSave((s) => (s === 'conflict' ? s : 'dirty'));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (dirtyRef.current) saveNow();
      }, 1500);
    },
    [saveNow],
  );

  // Warn before leaving with unsaved edits (tab close and in-app navigation).
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (save === 'dirty' || save === 'saving' || save === 'error') && !nextLocation.pathname.startsWith(`/games/${id}/edit`) && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    saveNow().then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker, saveNow]);

  const issues = useMemo(() => (doc ? publishIssues(doc) : []), [doc]);

  const publish = async () => {
    setPublishing(true);
    setServerIssues(null);
    try {
      if (!(await saveNow())) throw new Error('تعذّر حفظ آخر التعديلات قبل النشر.');
      const { game } = await api<{ game: GameRecord }>(`/games/${id}/publish`, { method: 'POST' });
      setRecord(game);
      toast(record?.publishedVersion ? 'نُشرت التعديلات. الطالبات يرين الآن النسخة الجديدة.' : 'نُشرت اللعبة! انسخي الرابط وشاركيه مع طالباتكِ.');
    } catch (e) {
      if (e instanceof ApiError && Array.isArray(e.data.issues)) setServerIssues(e.data.issues as Issue[]);
      toast((e as Error).message, 'error');
    } finally {
      setPublishing(false);
    }
  };
  const unpublish = async () => {
    try {
      const { game } = await api<{ game: GameRecord }>(`/games/${id}/unpublish`, { method: 'POST' });
      setRecord(game);
      toast('أُوقف النشر. الرابط لن يفتح اللعبة حتى تعيدي نشرها.', 'info');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  if (loadError)
    return (
      <div className="page">
        <TopBar />
        <main className="container">
          <div className="alert error">{loadError}</div>
          <Link to="/dashboard" className="btn ghost">
            العودة إلى ألعابي
          </Link>
        </main>
      </div>
    );
  if (!doc || !record) return <Spinner />;

  const current = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const index = STEPS.indexOf(current);
  const sectionIssues = (s: StepId) => issues.filter((i) => i.section === s).length;
  const go = (s: StepId) => nav(`/games/${id}/edit/${s}`);
  const status = save === 'saved' && record.status;

  const props: StepProps = { doc, update };
  return (
    <div className="page editor-page">
      <TopBar>
        <div className="editor-title">
          <Link to="/dashboard" className="crumb">
            <Icon name="chevronRight" size={16} /> ألعابي
          </Link>
          <strong>{doc.meta.title || 'لعبة بلا اسم'}</strong>
          {status && <span className={`status-pill ${status}`}>{STATUS_LABEL[status]}</span>}
        </div>
      </TopBar>

      <div className="editor-bar">
        <SaveIndicator state={save} error={saveError} onRetry={saveNow} onReload={load} />
        <div className="editor-actions">
          <button className="btn outline" onClick={() => setPreviewing(true)} disabled={doc.questions.length === 0} title={doc.questions.length ? '' : 'أضيفي سؤالًا واحدًا على الأقل للمعاينة'}>
            <Icon name="eye" /> معاينة اللعبة
          </button>
          <button className="btn ghost" onClick={() => saveNow().then((ok) => ok && toast('حُفظت المسودة.'))} disabled={save === 'saving'}>
            <Icon name="check" /> حفظ المسودة
          </button>
          {step !== 'publish' && (
            <button className="btn primary" onClick={() => go('publish')}>
              <Icon name="link" /> {record.isPublished ? 'النشر والمشاركة' : 'نشر اللعبة'}
            </button>
          )}
        </div>
      </div>

      <div className="editor-layout">
        <nav className="steps" aria-label="خطوات إعداد اللعبة">
          {STEPS.map((s, i) => {
            const n = s.id === 'publish' ? 0 : sectionIssues(s.id);
            return (
              <Link key={s.id} to={`/games/${id}/edit/${s.id}`} className={`step${s.id === current.id ? ' active' : ''}`} aria-current={s.id === current.id ? 'step' : undefined}>
                <span className="step-index">{i + 1}</span>
                <Icon name={s.icon} size={18} />
                <span className="step-label">{s.label}</span>
                {n > 0 && (
                  <span className="step-badge" title={`${n} ملاحظة قبل النشر`}>
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
          <Link to={`/games/${id}/results`} className="step results-link">
            <span className="step-index">
              <Icon name="chart" size={14} />
            </span>
            <span className="step-label">نتائج الطالبات</span>
          </Link>
        </nav>

        <main className="editor-main">
          <header className="step-head">
            <h1>{current.label}</h1>
          </header>
          {current.id === 'info' && <InfoStep {...props} />}
          {current.id === 'template' && <TemplateStep {...props} />}
          {current.id === 'questions' && <QuestionsStep {...props} />}
          {current.id === 'settings' && <SettingsStep {...props} />}
          {current.id === 'look' && <LookStep {...props} />}
          {current.id === 'publish' && (
            <PublishStep
              doc={doc}
              record={record}
              issues={serverIssues ?? issues}
              publishing={publishing}
              saveState={save}
              onPublish={publish}
              onUnpublish={unpublish}
              onPreview={() => setPreviewing(true)}
              onGo={go}
            />
          )}
          <footer className="step-nav">
            {index > 0 ? (
              <button className="btn ghost" onClick={() => go(STEPS[index - 1].id)}>
                <Icon name="arrowRight" /> السابق: {STEPS[index - 1].label}
              </button>
            ) : (
              <span />
            )}
            {index < STEPS.length - 1 && (
              <button className="btn primary" onClick={() => go(STEPS[index + 1].id)}>
                التالي: {STEPS[index + 1].label} <Icon name="arrowLeft" />
              </button>
            )}
          </footer>
        </main>
      </div>

      {previewing && (
        <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="معاينة اللعبة">
          <GamePlayer doc={doc} mode="preview" onExit={() => setPreviewing(false)} />
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state, error, onRetry, onReload }: { state: SaveState; error: string | null; onRetry: () => void; onReload: () => void }) {
  if (state === 'conflict')
    return (
      <div className="save-state conflict" role="alert">
        <Icon name="warn" size={18} /> {error}
        <button className="btn small outline" onClick={onReload}>
          تحميل أحدث نسخة
        </button>
      </div>
    );
  if (state === 'error')
    return (
      <div className="save-state error" role="alert">
        <Icon name="warn" size={18} /> لم تُحفظ آخر التعديلات. {error}
        <button className="btn small outline" onClick={onRetry}>
          إعادة المحاولة
        </button>
      </div>
    );
  return (
    <div className={`save-state ${state}`} aria-live="polite">
      {state === 'saving' ? (
        <>
          <span className="spinner small" /> جارٍ الحفظ…
        </>
      ) : state === 'dirty' ? (
        <>
          <Icon name="edit" size={16} /> تعديلات لم تُحفظ بعد
        </>
      ) : (
        <>
          <Icon name="check" size={16} /> {LOCAL ? 'المسودة محفوظة على هذا الجهاز' : 'المسودة محفوظة في حسابكِ'}
        </>
      )}
    </div>
  );
}
