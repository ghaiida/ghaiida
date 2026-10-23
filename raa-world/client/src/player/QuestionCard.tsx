// One question, shared by every template: answer → check → retry or feedback → continue.
import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../api.ts';
import { Icon } from '../ui/Icon.tsx';
import { correctAnswerText, isCorrect, pointsFor, type PlayQuestion, type Response } from '../../../shared/engine.ts';
import type { GameSettings, Option } from '../../../shared/schema.ts';
import type { AskOptions, AskResult } from './types.ts';
import type { Sfx } from './sound.ts';
import { pickOne, type Words } from './words.ts';

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const CORRIDORS: ('arrowRight' | 'arrowUp' | 'arrowLeft' | 'arrowDown')[] = ['arrowRight', 'arrowUp', 'arrowLeft', 'arrowDown', 'arrowUp', 'arrowLeft'];

type Status = 'answering' | 'retry' | 'correct' | 'failed';

export function QuestionCard({
  pq,
  opts,
  settings,
  words: w,
  sfx,
  onDone,
}: {
  pq: PlayQuestion;
  opts: AskOptions;
  settings: GameSettings;
  words: Words;
  sfx: Sfx;
  onDone: (r: AskResult) => void;
}) {
  const { q } = pq;
  const [status, setStatus] = useState<Status>('answering');
  const [tries, setTries] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [order, setOrder] = useState<Option[]>(pq.options);
  const [message, setMessage] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const done = status === 'correct' || status === 'failed';
  const maxTries = settings.triesPerQuestion;
  const hintAvailable = settings.hints !== 'off' && q.hint.trim().length > 0;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  useEffect(() => {
    if (done) continueRef.current?.focus();
  }, [done]);

  const check = (r: Response) => {
    if (done) return;
    const ok = isCorrect(q, r);
    const n = tries + 1;
    setTries(n);
    opts.onTry?.(ok);
    if (ok) {
      sfx.correct();
      setStatus('correct');
      setMessage(settings.correctMessage.trim() || pickOne(w.correct));
    } else if (n < maxTries) {
      sfx.wrong();
      setStatus('retry');
      setMessage(settings.wrongMessage.trim() || pickOne(w.retry));
      if (r.type === 'mcq') setWrongPicks((s) => new Set(s).add(r.optionId));
      if (r.type === 'tf') setWrongPicks((s) => new Set(s).add(String(r.value)));
    } else {
      sfx.wrong();
      setStatus('failed');
      setMessage(pickOne(w.failed));
      if (r.type === 'mcq') setWrongPicks((s) => new Set(s).add(r.optionId));
      if (r.type === 'tf') setWrongPicks((s) => new Set(s).add(String(r.value)));
    }
  };

  const points = status === 'correct' && !opts.practice ? pointsFor(settings, { correct: true, tries, usedHint }) : 0;
  const triesLeft = maxTries - tries;
  const reveal = status === 'failed' && settings.showCorrectAnswer;
  const correctOptionId = q.type === 'mcq' ? q.correctId : null;

  return (
    <div className={`qsheet-backdrop ${opts.placement ?? 'center'} variant-${opts.variant}`}>
      <section className={`qsheet ${status}`} role="dialog" aria-modal="true" aria-labelledby="q-prompt">
        <header className="qsheet-head">
          <span className="q-label">
            {opts.practice && <b className="practice-tag">جولة تدريب</b>}
            {opts.label}
          </span>
          {maxTries > 1 && !done && (
            <span className="tries" aria-label={w.triesLeft(triesLeft)} title={w.triesLeft(triesLeft)}>
              {Array.from({ length: maxTries }, (_, i) => (
                <i key={i} className={i < triesLeft ? 'on' : ''} />
              ))}
            </span>
          )}
        </header>

        {q.imageId && <img className="q-image" src={assetUrl(q.imageId)} alt="صورة السؤال" />}
        <h2 id="q-prompt" ref={headingRef} tabIndex={-1}>
          {q.prompt}
        </h2>

        {q.type === 'mcq' && (
          <div className={`choices${pq.options.some((o) => o.text.length > 28) ? ' long' : ''}`}>
            {pq.options.map((o, i) => {
              const isWrong = wrongPicks.has(o.id);
              const isRight = done && (status === 'correct' ? picked === o.id : reveal && o.id === correctOptionId);
              return (
                <button
                  key={o.id}
                  className={`choice${isWrong ? ' wrong' : ''}${isRight ? ' right' : ''}`}
                  disabled={done || isWrong}
                  onClick={() => {
                    setPicked(o.id);
                    check({ type: 'mcq', optionId: o.id });
                  }}
                >
                  <span className="choice-key" aria-hidden>
                    {opts.variant === 'maze' ? <Icon name={CORRIDORS[i]} size={18} /> : LETTERS[i]}
                  </span>
                  <span className="choice-text">{o.text}</span>
                  {isRight && <Icon name="check" size={20} />}
                  {isWrong && <Icon name="x" size={20} />}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'tf' && (
          <div className="choices tf">
            {[true, false].map((v) => {
              const isWrong = wrongPicks.has(String(v));
              const isRight = done && (status === 'correct' ? picked === String(v) : reveal && v === q.answer);
              return (
                <button
                  key={String(v)}
                  className={`choice tf-${v}${isWrong ? ' wrong' : ''}${isRight ? ' right' : ''}`}
                  disabled={done || isWrong}
                  onClick={() => {
                    setPicked(String(v));
                    check({ type: 'tf', value: v });
                  }}
                >
                  <Icon name={v ? 'check' : 'x'} size={26} />
                  <span className="choice-text">{v ? 'صح' : 'خطأ'}</span>
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'short' && (
          <form
            className="short-answer"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) check({ type: 'short', text });
            }}
          >
            <label htmlFor="short-input" className="sr-only">
              {w.yourAnswer}
            </label>
            <input id="short-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={w.typeHere} disabled={done} autoComplete="off" maxLength={120} />
            {!done && (
              <button className="pbtn primary" disabled={!text.trim()}>
                {w.check}
              </button>
            )}
          </form>
        )}

        {q.type === 'order' && (
          <div className="order-answer">
            {!done && <p className="order-help">{w.orderHelp}</p>}
            <ol>
              {order.map((o, i) => (
                <li key={o.id} className={done ? (status === 'correct' ? 'right' : '') : ''}>
                  <span className="order-pos">{i + 1}</span>
                  <span className="choice-text">{o.text}</span>
                  {!done && (
                    <span className="order-moves">
                      <button
                        aria-label={`تقديم «${o.text}»`}
                        disabled={i === 0}
                        onClick={() => {
                          const a = order.slice();
                          [a[i - 1], a[i]] = [a[i], a[i - 1]];
                          setOrder(a);
                        }}
                      >
                        <Icon name="arrowUp" size={18} />
                      </button>
                      <button
                        aria-label={`تأخير «${o.text}»`}
                        disabled={i === order.length - 1}
                        onClick={() => {
                          const a = order.slice();
                          [a[i + 1], a[i]] = [a[i], a[i + 1]];
                          setOrder(a);
                        }}
                      >
                        <Icon name="arrowDown" size={18} />
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {!done && (
              <button className="pbtn primary" onClick={() => check({ type: 'order', ids: order.map((o) => o.id) })}>
                {w.check}
              </button>
            )}
          </div>
        )}

        {hintAvailable && !done && (
          <div className="hint-area">
            {usedHint ? (
              <p className="hint-text">
                <Icon name="bulb" size={18} /> {q.hint}
              </p>
            ) : (
              <button className="pbtn ghost small" onClick={() => setUsedHint(true)}>
                <Icon name="bulb" size={18} /> {w.hint}
                {settings.hints === 'penalty' && !opts.practice && <small> ({w.hintPenalty})</small>}
              </button>
            )}
          </div>
        )}

        <div className="feedback" aria-live="assertive">
          {status !== 'answering' && (
            <div className={`feedback-box ${status}`}>
              <p className="feedback-msg">
                <Icon name={status === 'correct' ? 'sparkles' : status === 'retry' ? 'refresh' : 'heart'} size={20} />
                {message}
                {points > 0 && <b className="points-pop">+{points}</b>}
              </p>
              {status === 'retry' && <p className="feedback-sub">{w.triesLeft(triesLeft)}</p>}
              {reveal && q.type !== 'mcq' && q.type !== 'tf' && (
                <p className="feedback-sub">
                  الإجابة الصحيحة: <b>{correctAnswerText(q)}</b>
                </p>
              )}
              {done && settings.showExplanation && q.explanation.trim() && (status === 'correct' || settings.showCorrectAnswer) && (
                <p className="explanation">
                  <Icon name="info" size={18} /> {q.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {done && (
          <button ref={continueRef} className="pbtn primary lg continue" onClick={() => onDone({ correct: status === 'correct', tries, usedHint, revealed: status === 'failed' })}>
            {w.next} <Icon name="arrowLeft" />
          </button>
        )}
      </section>
    </div>
  );
}
