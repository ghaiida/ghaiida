// Template 3 — افتحي البوابة: a sequence of gates, each sealed by several locks. The student
// chooses which lock to attempt; a right answer gives a gold key, an answer revealed after all
// tries gives a silver key. Every wrong try costs a heart; running out reseals the gate.
import { useRef, useState } from 'react';
import { Icon } from '../../ui/Icon.tsx';
import { GATE_HEARTS, splitIntoGroups } from '../../../../shared/engine.ts';
import { wait, type TemplateProps } from '../types.ts';

const GATE_NAMES = ['بوابة الفجر', 'بوابة الرمال', 'بوابة القمر', 'بوابة النخيل', 'بوابة الرياح', 'بوابة الضياء'];
type Lock = 'locked' | 'gold' | 'silver';

export function GatesChallenge({ round, doc, ask, sfx, words: w, reducedMotion, onComplete }: TemplateProps) {
  const gates = useState(() => splitIntoGroups(round, 3))[0];
  const baseHearts = GATE_HEARTS[doc.settings.difficulty];
  const [gate, setGate] = useState(0);
  const [locks, setLocks] = useState<Lock[]>(() => gates[0].map(() => 'locked'));
  const [maxHearts, setMaxHearts] = useState(baseHearts);
  const [hearts, setHearts] = useState(baseHearts);
  const [phase, setPhase] = useState<'locks' | 'busy' | 'opening' | 'resealed'>('locks');
  const [lostAt, setLostAt] = useState<number | null>(null);
  const heartsRef = useRef(baseHearts);
  const goldRef = useRef(0);

  const name = (i: number) => (i === gates.length - 1 && gates.length > 1 ? 'البوابة الذهبية' : GATE_NAMES[i % GATE_NAMES.length]);

  const tryLock = async (i: number) => {
    if (phase !== 'locks' || locks[i] !== 'locked') return;
    setPhase('busy');
    const r = await ask(gates[gate][i], {
      label: `${name(gate)} · القفل ${i + 1} من ${gates[gate].length}`,
      variant: 'gates',
      onTry: (ok) => {
        if (ok) return;
        heartsRef.current = Math.max(0, heartsRef.current - 1);
        setHearts(heartsRef.current);
        setLostAt(heartsRef.current);
      },
    });
    const next = locks.slice();
    next[i] = r.correct ? 'gold' : 'silver';
    if (r.correct) goldRef.current++;
    setLocks(next);

    if (heartsRef.current <= 0 && next.some((l) => l === 'locked')) {
      // Out of energy before the gate opened: reseal it, with one extra heart for the retry.
      setPhase('resealed');
      await wait(reducedMotion ? 900 : 2600);
      const more = maxHearts + 1;
      setMaxHearts(more);
      heartsRef.current = more;
      setHearts(more);
      setLostAt(null);
      setLocks(gates[gate].map(() => 'locked'));
      setPhase('locks');
      return;
    }
    if (next.every((l) => l !== 'locked')) {
      setPhase('opening');
      sfx.unlock();
      await wait(reducedMotion ? 600 : 1900);
      if (gate === gates.length - 1) {
        onComplete(w.g(`فتحتِ ${gates.length} بوابات وجمعتِ ${goldRef.current} مفتاحًا ذهبيًا.`, `فتحت ${gates.length} بوابات وجمعت ${goldRef.current} مفتاحًا ذهبيًا.`));
        return;
      }
      const g = gate + 1;
      setGate(g);
      setLocks(gates[g].map(() => 'locked'));
      setMaxHearts(baseHearts);
      heartsRef.current = baseHearts;
      setHearts(baseHearts);
      setLostAt(null);
      setPhase('locks');
      return;
    }
    setPhase('locks');
  };

  return (
    <div className={`gates-game phase-${phase}`}>
      <div className="gates-top">
        <div className="gate-progress" aria-label={`البوابة ${gate + 1} من ${gates.length}`}>
          {gates.map((_, i) => (
            <span key={i} className={i < gate ? 'done' : i === gate ? 'now' : ''}>
              {i < gate ? <Icon name="check" size={14} /> : i + 1}
            </span>
          ))}
        </div>
        <div className="hearts" aria-label={`الطاقة: ${hearts} من ${maxHearts}`}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <span key={i} className={`heart${i < hearts ? ' full' : ''}${lostAt === i ? ' lost' : ''}`}>
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
                <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
              </svg>
            </span>
          ))}
        </div>
      </div>

      <h2 className="gate-name">{name(gate)}</h2>

      <div className="gate-scene">
        <svg viewBox="0 0 320 300" className="gate-svg" aria-hidden>
          <defs>
            <linearGradient id="gate-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--acc)" stopOpacity=".95" />
              <stop offset="1" stopColor="var(--acc)" stopOpacity=".25" />
            </linearGradient>
          </defs>
          <rect x="0" y="262" width="320" height="38" fill="var(--ground)" />
          <path d="M60 270V118a100 100 0 0 1 200 0v152Z" fill="var(--pd)" />
          <path d="M84 270V122a76 76 0 0 1 152 0v148Z" fill="url(#gate-glow)" className="gate-light" />
          <g className="leaf leaf-r">
            <path d="M160 46a76 76 0 0 1 76 76v148h-76Z" fill="var(--p)" />
            <path d="M176 120h44M176 170h44M176 220h44" stroke="var(--pd)" strokeWidth="4" strokeLinecap="round" opacity=".35" />
          </g>
          <g className="leaf leaf-l">
            <path d="M160 46a76 76 0 0 0-76 76v148h76Z" fill="var(--p)" />
            <path d="M100 120h44M100 170h44M100 220h44" stroke="var(--pd)" strokeWidth="4" strokeLinecap="round" opacity=".35" />
          </g>
          <path d="M52 270V116a108 108 0 0 1 216 0v154" fill="none" stroke="var(--pd)" strokeWidth="10" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={160 + 108 * Math.cos(Math.PI + (i * Math.PI) / 4)} cy={116 + 108 * Math.sin(Math.PI + (i * Math.PI) / 4)} r="6" fill="var(--acc)" />
          ))}
        </svg>
        <div className="locks" role="group" aria-label="الأقفال">
          {locks.map((l, i) => (
            <button key={i} className={`lock ${l}`} onClick={() => tryLock(i)} disabled={phase !== 'locks' || l !== 'locked'} aria-label={l === 'locked' ? `القفل ${i + 1}: ${w.pick}` : `القفل ${i + 1}: مفتوح`}>
              <Icon name={l === 'locked' ? 'lock' : 'key'} size={28} />
              <span>{l === 'locked' ? i + 1 : l === 'gold' ? 'ذهبي' : 'فضي'}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="gate-hint" role="status">
        {phase === 'locks' && w.g('اختاري أي قفل لتبدئي.', 'اختر أي قفل لتبدأ.')}
        {phase === 'opening' && w.g('أحسنتِ! البوابة تُفتح…', 'أحسنت! البوابة تُفتح…')}
        {phase === 'resealed' && w.g('نفدت الطاقة فأُغلقت البوابة. لا بأس! ستبدئين من جديد ومعكِ قلب إضافي.', 'نفدت الطاقة فأُغلقت البوابة. لا بأس! ستبدأ من جديد ومعك قلب إضافي.')}
      </p>
    </div>
  );
}
