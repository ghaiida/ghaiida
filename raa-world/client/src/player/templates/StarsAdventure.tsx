// Template 1 — مغامرة جمع النجوم: a map of zones. Each zone is a short set of questions;
// stars earned (3/2/1 by try) must reach the difficulty threshold to unlock the next zone,
// otherwise a practice round revisits the zone's imperfect answers.
import { useState } from 'react';
import { Icon, StarShape } from '../../ui/Icon.tsx';
import { STAR_THRESHOLD, splitIntoGroups, type PlayQuestion } from '../../../../shared/engine.ts';
import { wait, type TemplateProps } from '../types.ts';

const ZONE_NAMES = ['واحة البداية', 'غابة الأسرار', 'نهر المعرفة', 'جبل الحكمة', 'وادي الإبداع', 'سهول الاكتشاف', 'كهف الألغاز', 'قلعة النجوم'];
const ZONE_ICONS = ['palm', 'tree', 'wave', 'mountain', 'flower', 'sun', 'cave', 'castle'] as const;

function ZoneGlyph({ kind }: { kind: (typeof ZONE_ICONS)[number] }) {
  const p: Record<typeof kind, string> = {
    palm: 'M12 22V11M12 11C9 7 5 7 3 9M12 11c3-4 7-4 9-2M12 11C11 7 8 4 5 4M12 11c1-4 4-7 7-7',
    tree: 'M12 22v-5M7 17h10L12 3z',
    wave: 'M2 9c3-3 5 3 8 0s5 3 8 0 4 0 4 0M2 15c3-3 5 3 8 0s5 3 8 0 4 0 4 0',
    mountain: 'M2 20L9 7l4 6 3-4 6 11z',
    flower: 'M12 22v-8M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 8V4M16 11h4M8 11H4',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
    cave: 'M3 20c0-9 4-15 9-15s9 6 9 15zM9 20c0-4 1.5-7 3-7s3 3 3 7',
    castle: 'M4 21V9h3v3h3V9h4v3h3V9h3v12zM10 21v-5h4v5',
  };
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={p[kind]} />
    </svg>
  );
}

interface Zone {
  name: string;
  icon: (typeof ZONE_ICONS)[number];
  questions: PlayQuestion[];
  stars: Record<string, number>; // per question, 0..3
}

const starsFor = (correct: boolean, tries: number) => (correct ? Math.max(1, 4 - tries) : 0);

export function StarsAdventure({ round, doc, ask, sfx, words: w, reducedMotion, onComplete }: TemplateProps) {
  const [zones, setZones] = useState<Zone[]>(() =>
    splitIntoGroups(round, 3).map((questions, i, all) => ({
      name: i === all.length - 1 && all.length > 1 ? 'قلعة النجوم' : ZONE_NAMES[i % (ZONE_NAMES.length - 1)] + (i >= ZONE_NAMES.length - 1 ? ` ${Math.floor(i / (ZONE_NAMES.length - 1)) + 1}` : ''),
      icon: i === all.length - 1 && all.length > 1 ? 'castle' : ZONE_ICONS[i % (ZONE_ICONS.length - 1)],
      questions,
      stars: {},
    })),
  );
  const [current, setCurrent] = useState(0); // first zone not yet cleared
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'unlock' | 'practice' | 'cleared'; text: string } | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);

  const ratio = STAR_THRESHOLD[doc.settings.difficulty];
  const need = (z: Zone) => Math.max(1, Math.ceil(z.questions.length * 3 * ratio));
  const sum = (z: Zone) => Object.values(z.stars).reduce((a, b) => a + b, 0);
  const totalStars = zones.reduce((s, z) => s + sum(z), 0);
  const maxStars = round.length * 3;

  const playZone = async (index: number) => {
    if (busy || index !== current) return;
    setBusy(true);
    setBanner(null);
    const zone = zones[index];
    const stars: Record<string, number> = { ...zone.stars };
    const save = () => setZones((zs) => zs.map((z, i) => (i === index ? { ...z, stars: { ...stars } } : z)));

    for (let i = 0; i < zone.questions.length; i++) {
      const pq = zone.questions[i];
      const r = await ask(pq, { label: `${zone.name} · سؤال ${i + 1} من ${zone.questions.length}`, variant: 'stars' });
      stars[pq.q.id] = r.correct && r.usedHint && doc.settings.hints === 'penalty' ? Math.max(1, starsFor(true, r.tries) - 1) : starsFor(r.correct, r.tries);
      save();
    }

    // Practice until the zone has enough stars: each correct practice answer adds one star.
    const total = () => Object.values(stars).reduce((a, b) => a + b, 0);
    while (total() < need(zone)) {
      const missing = need(zone) - total();
      setBanner({
        kind: 'practice',
        text: w.g(`تحتاجين إلى ${missing} ${missing === 1 ? 'نجمة' : 'نجوم'} إضافية لفتح المنطقة التالية. لنتدرّب على الأسئلة التي يمكنكِ تحسينها!`, `تحتاج إلى ${missing} ${missing === 1 ? 'نجمة' : 'نجوم'} إضافية لفتح المنطقة التالية. لنتدرّب على الأسئلة التي يمكنك تحسينها!`),
      });
      await wait(reducedMotion ? 600 : 1800);
      const practice = zone.questions.filter((p) => (stars[p.q.id] ?? 0) < 3).sort((a, b) => (stars[a.q.id] ?? 0) - (stars[b.q.id] ?? 0));
      for (const pq of practice) {
        if (total() >= need(zone)) break;
        const r = await ask(pq, { label: `${zone.name} · تدريب`, variant: 'stars', practice: true });
        if (r.correct) {
          stars[pq.q.id] = Math.min(3, (stars[pq.q.id] ?? 0) + 1);
          save();
        }
      }
    }

    sfx.unlock();
    if (index === zones.length - 1) {
      setBanner({ kind: 'cleared', text: w.g('فتحتِ كل المناطق!', 'فتحت كل المناطق!') });
      setCurrent(index + 1);
      await wait(reducedMotion ? 400 : 1400);
      const finalStars = zones.reduce((s, z, i) => s + (i === index ? total() : sum(z)), 0);
      onComplete(w.g(`جمعتِ ${finalStars} نجمة من ${maxStars} وفتحتِ ${zones.length} مناطق.`, `جمعت ${finalStars} نجمة من ${maxStars} وفتحت ${zones.length} مناطق.`));
      return;
    }
    setBanner({ kind: 'unlock', text: w.g(`رائع! جمعتِ ${total()} نجوم وفُتحت «${zones[index + 1].name}».`, `رائع! جمعت ${total()} نجوم وفُتحت «${zones[index + 1].name}».`) });
    setCurrent(index + 1);
    setJustUnlocked(index + 1);
    setBusy(false);
  };

  // Map geometry: zones zig-zag down a winding path.
  const W = 360;
  const rowH = 150;
  const H = 80 + (zones.length - 1) * rowH + 110;
  const pos = zones.map((_, i) => ({ x: [W * 0.72, W * 0.3, W * 0.62, W * 0.26][i % 4], y: 80 + i * rowH }));
  const pathD = pos.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${pos[i - 1].x} ${pos[i - 1].y + rowH * 0.6}, ${p.x} ${p.y - rowH * 0.6}, ${p.x} ${p.y}`)).join(' ');
  const doneD = pos
    .slice(0, Math.min(current, zones.length - 1) + 1)
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${pos[i - 1].x} ${pos[i - 1].y + rowH * 0.6}, ${p.x} ${p.y - rowH * 0.6}, ${p.x} ${p.y}`))
    .join(' ');

  return (
    <div className="stars-game">
      <div className="stars-ribbon">
        <span className="ribbon-stars">
          <StarShape size={24} /> <b>{totalStars}</b> / {maxStars}
        </span>
        <span className="ribbon-zone">
          <Icon name="map" size={18} /> المنطقة {Math.min(current + 1, zones.length)} من {zones.length}
        </span>
      </div>
      {banner && (
        <div className={`stars-banner ${banner.kind}`} role="status">
          <Icon name={banner.kind === 'practice' ? 'refresh' : 'unlock'} size={20} /> {banner.text}
        </div>
      )}
      <div className="stars-map" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="map-svg" aria-hidden>
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="var(--ground)" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" />
          {pos.map((p, i) => {
            const x = p.x > W / 2 ? 58 : W - 58;
            return (
              <g key={`deco-${i}`} opacity=".6" transform={`translate(${x} ${p.y + 12})`}>
                <ellipse cy="22" rx="36" ry="9" fill="var(--ground)" />
                <rect x="-2.5" y="2" width="5" height="18" rx="2" fill="var(--pd)" opacity=".45" />
                <circle cy="-4" r="13" fill="var(--p)" opacity=".4" />
                <circle cx="16" cy="8" r="8" fill="var(--p)" opacity=".3" />
                <rect x="13.5" y="12" width="4" height="9" rx="2" fill="var(--pd)" opacity=".35" />
              </g>
            );
          })}
          <path d={pathD} fill="none" stroke="var(--ground)" strokeWidth="16" strokeLinecap="round" />
          <path d={pathD} fill="none" stroke="var(--surface)" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
          {current > 0 && <path d={doneD} fill="none" stroke="var(--acc)" strokeWidth="6" strokeLinecap="round" className="path-done" />}
        </svg>
        {zones.map((z, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'locked';
          const got = sum(z);
          return (
            <div key={i} className={`zone ${state}${justUnlocked === i ? ' unlocked-now' : ''}`} style={{ left: `${(pos[i].x / W) * 100}%`, top: `${(pos[i].y / H) * 100}%` }}>
              <button
                className="zone-node"
                onClick={() => playZone(i)}
                disabled={state !== 'current' || busy}
                aria-label={`${z.name}: ${state === 'locked' ? 'مغلقة' : state === 'done' ? `مكتملة، ${got} نجوم` : w.tapToStart}`}
              >
                {state === 'locked' ? <Icon name="lock" size={26} /> : <ZoneGlyph kind={z.icon} />}
              </button>
              <div className="zone-label">
                <b>{z.name}</b>
                <span className="zone-stars" aria-hidden>
                  {state === 'locked' ? (
                    <>
                      <Icon name="lock" size={12} /> تحتاج {need(z)} نجوم
                    </>
                  ) : (
                    <>
                      <StarShape size={14} /> {got}/{z.questions.length * 3}
                    </>
                  )}
                </span>
                {state === 'current' && !busy && <span className="zone-cta">{w.tapToStart}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
