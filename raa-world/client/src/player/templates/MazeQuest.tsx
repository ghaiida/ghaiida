// Template 2 — المتاهة التعليمية: the player walks a generated maze. Every checkpoint on the
// route is a locked door whose question picks the right corridor. Difficulty controls the fog
// and whether a missed door sends the player back to the previous checkpoint.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../ui/Icon.tsx';
import { MAZE_FOG, createRng } from '../../../../shared/engine.ts';
import { generateMaze } from '../../../../shared/maze.ts';
import { wait, type TemplateProps } from '../types.ts';

const CELL = 10;

export function MazeQuest({ round, doc, ask, sfx, words: w, reducedMotion, onComplete }: TemplateProps) {
  const maze = useMemo(() => generateMaze(round.length, createRng(Math.floor(Math.random() * 1e9))), [round]);
  const { cols, rows, openE, openS, path, checkpoints } = maze;
  const fog = MAZE_FOG[doc.settings.difficulty];
  const [posIdx, setPosIdx] = useState(0); // index into path
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [opened, setOpened] = useState(0); // doors opened
  const [atDoor, setAtDoor] = useState<number | null>(null);
  const [steps, setSteps] = useState(0);
  const [bump, setBump] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const started = useRef(false);
  const posRef = useRef(0);
  const stepsRef = useRef(0);

  const walkTo = async (target: number) => {
    const dir = target > posRef.current ? 1 : -1;
    while (posRef.current !== target) {
      posRef.current += dir;
      stepsRef.current++;
      const p = posRef.current;
      setPosIdx(p);
      setSteps(stepsRef.current);
      setVisited((v) => (v.has(p) ? v : new Set(v).add(p)));
      if (!reducedMotion) {
        sfx.step();
        await wait(130);
      }
    }
    if (reducedMotion) await wait(250);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      await wait(500);
      for (let k = 0; k < round.length; k++) {
        await walkTo(checkpoints[k] - 1);
        setAtDoor(k);
        const r = await ask(round[k], {
          label: `الباب ${k + 1} من ${round.length}`,
          variant: 'maze',
          placement: 'side',
          onTry: (ok) => {
            if (!ok) {
              setBump((b) => b + 1);
              setNote('طريق مسدود!');
            } else setNote(null);
          },
        });
        setNote(null);
        if (r.revealed && doc.settings.difficulty === 'hard') {
          setNote(w.g('عودي إلى نقطة التفتيش السابقة…', 'عُد إلى نقطة التفتيش السابقة…'));
          const back = k === 0 ? 0 : checkpoints[k - 1];
          await walkTo(back);
          setNote(null);
          await walkTo(checkpoints[k] - 1);
        }
        setAtDoor(null);
        setOpened(k + 1);
        sfx.unlock();
      }
      await walkTo(path.length - 1);
      await wait(reducedMotion ? 200 : 700);
      onComplete(w.g(`خرجتِ من المتاهة بعد ${stepsRef.current} خطوة وفتحتِ ${round.length} أبواب.`, `خرجت من المتاهة بعد ${stepsRef.current} خطوة وفتحت ${round.length} أبواب.`));
    })();
    // The run is started once per mounted round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cells the player can currently see.
  const revealed = useMemo(() => {
    if (fog >= 99) return null;
    const set = new Set<number>();
    for (const i of visited) {
      const c = path[i];
      const cx = c % cols;
      const cy = Math.floor(c / cols);
      for (let dy = -fog; dy <= fog; dy++)
        for (let dx = -fog; dx <= fog; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && y >= 0 && x < cols && y < rows) set.add(y * cols + x);
        }
    }
    return set;
  }, [visited, fog, path, cols, rows]);

  const walls = useMemo(() => {
    let d = `M0 0H${cols * CELL}V${rows * CELL}H0Z`;
    for (let c = 0; c < cols * rows; c++) {
      const x = (c % cols) * CELL;
      const y = Math.floor(c / cols) * CELL;
      if (c % cols < cols - 1 && !openE[c]) d += `M${x + CELL} ${y}v${CELL}`;
      if (Math.floor(c / cols) < rows - 1 && !openS[c]) d += `M${x} ${y + CELL}h${CELL}`;
    }
    return d;
  }, [cols, rows, openE, openS]);

  const center = (c: number) => [(c % cols) * CELL + CELL / 2, Math.floor(c / cols) * CELL + CELL / 2] as const;
  const trail = [...visited].sort((a, b) => a - b);
  const trailD = trail.map((i, n) => `${n ? 'L' : 'M'}${center(path[i]).join(' ')}`).join('');
  const [px, py] = center(path[posIdx]);
  const exit = path[path.length - 1];
  const [ex, ey] = center(exit);
  const stroke = Math.max(0.9, Math.min(1.6, 14 / cols));

  return (
    <div className="maze-game">
      <div className="maze-info">
        <span>
          <Icon name="door" size={18} /> الأبواب: <b>{opened}</b>/{round.length}
        </span>
        <span>
          <Icon name="map" size={18} /> الخطوات: <b>{steps}</b>
        </span>
        {fog < 99 && (
          <span className="fog-note">
            <Icon name="eye" size={18} /> {fog === 1 ? 'ضباب كثيف' : 'ضباب خفيف'}
          </span>
        )}
      </div>
      <div className="maze-board">
        <svg viewBox={`-2 -2 ${cols * CELL + 4} ${rows * CELL + 4}`} className="maze-svg" role="img" aria-label={`متاهة. فُتح ${opened} من ${round.length} أبواب.`}>
          <rect x="0" y="0" width={cols * CELL} height={rows * CELL} fill="var(--surface)" rx="1" />
          <path d={trailD} fill="none" stroke="var(--p)" strokeOpacity=".28" strokeWidth={CELL * 0.55} strokeLinecap="round" strokeLinejoin="round" />
          {/* exit flag */}
          <g transform={`translate(${ex} ${ey})`}>
            <rect x={-CELL / 2 + 1} y={-CELL / 2 + 1} width={CELL - 2} height={CELL - 2} rx="1.5" fill="var(--acc)" opacity=".25" />
            <path d="M-2 3.4V-3.6M-2 -3.6h4.4l-1 1.6 1 1.6H-2" fill="none" stroke="var(--pd)" strokeWidth=".9" strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {checkpoints.map((ci, k) => {
            const [x, y] = center(path[ci]);
            const isOpen = k < opened;
            return (
              <g key={k} transform={`translate(${x} ${y})`} className={`door${isOpen ? ' open' : ''}${atDoor === k ? ' active' : ''}`}>
                <rect x={-CELL / 2 + 1.2} y={-CELL / 2 + 1.2} width={CELL - 2.4} height={CELL - 2.4} rx="1.6" fill={isOpen ? 'var(--soft)' : 'var(--acc)'} stroke={isOpen ? 'var(--p)' : 'var(--pd)'} strokeWidth=".6" />
                {isOpen ? (
                  <path d="M-2 0l1.4 1.4L2.2-1.6" fill="none" stroke="var(--pd)" strokeWidth=".9" strokeLinecap="round" />
                ) : (
                  <text y="1.6" textAnchor="middle" fontSize="4.4" fontWeight="800" fill="#fff">
                    {k + 1}
                  </text>
                )}
              </g>
            );
          })}
          <path d={walls} fill="none" stroke="var(--ink)" strokeOpacity=".8" strokeWidth={stroke} strokeLinecap="square" />
          {revealed &&
            Array.from({ length: cols * rows }, (_, c) =>
              revealed.has(c) ? null : <rect key={c} x={(c % cols) * CELL - 0.3} y={Math.floor(c / cols) * CELL - 0.3} width={CELL + 0.6} height={CELL + 0.6} className="fog" />,
            )}
          <g className="token" style={{ transform: `translate(${px}px, ${py}px)` }}>
            <g className={bump % 2 ? 'bump-a' : bump ? 'bump-b' : ''}>
              <circle r={CELL * 0.36} fill="var(--p)" stroke="#fff" strokeWidth="1.2" />
              <circle cx="-1.2" cy="-0.6" r=".55" fill="#fff" />
              <circle cx="1.2" cy="-0.6" r=".55" fill="#fff" />
              <path d="M-1.3 1.1q1.3 1.1 2.6 0" fill="none" stroke="#fff" strokeWidth=".55" strokeLinecap="round" />
            </g>
          </g>
        </svg>
        {note && (
          <div className="maze-note" role="status">
            <Icon name="warn" size={18} /> {note}
          </div>
        )}
      </div>
    </div>
  );
}
