// Small illustrations of each game template (used on the landing page, template picker and cards).
import type { TemplateId, ThemeId } from '../../../shared/schema.ts';
import { THEMES } from '../../../shared/catalog.ts';

export function TemplateArt({ id, theme = 'emerald' }: { id: TemplateId; theme?: ThemeId }) {
  const t = THEMES[theme];
  const common = { viewBox: '0 0 240 140', className: 'template-art', role: 'img' as const };
  if (id === 'stars')
    return (
      <svg {...common} aria-label="خريطة مناطق ونجوم">
        <rect width="240" height="140" rx="14" fill={t.sky} />
        <path d="M0 112 Q60 92 120 108 T240 100 V140 H0Z" fill={t.ground} />
        <path d="M30 104 C70 40 110 128 140 70 S210 40 214 28" fill="none" stroke={t.primary} strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
        {[
          [30, 104, true],
          [96, 82, true],
          [146, 66, false],
          [214, 28, false],
        ].map(([x, y, open], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="14" fill={open ? t.primary : '#fff'} stroke={open ? t.primaryDark : t.ground} strokeWidth="3" />
            {open ? (
              <path d="M0-7l2 4.3 4.7.7-3.4 3.3.8 4.7L0 3.8-4.2 6l.8-4.7L-6.8-2l4.7-.7z" fill={t.accent} />
            ) : (
              <path d="M-5-1h10v7h-10zM-3-1v-3a3 3 0 0 1 6 0v3" fill="none" stroke={t.primaryDark} strokeWidth="2" />
            )}
          </g>
        ))}
        <g fill={t.accent}>
          <path d="M60 30l2.6 5.3 5.8.8-4.2 4.1 1 5.8L60 43.3 54.8 46l1-5.8-4.2-4.1 5.8-.8z" />
          <path d="M178 96l2 4 4.4.6-3.2 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.2-3.1 4.4-.6z" />
        </g>
      </svg>
    );
  if (id === 'maze') {
    const walls = 'M20 20H220V120H20ZM20 45H70M95 20V70M45 70H120M145 45H195V95M170 70V120M45 95H145M70 95V120M195 45V20';
    return (
      <svg {...common} aria-label="متاهة بممرات ومخرج">
        <rect width="240" height="140" rx="14" fill={t.sky} />
        <rect x="20" y="20" width="200" height="100" fill="#fff" opacity=".7" />
        <path d="M208 32 H158 V58 H108 V82 H58 V108 H32" fill="none" stroke={t.primary} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".28" />
        <path d={walls} fill="none" stroke={t.ink} strokeWidth="4" strokeLinecap="round" opacity=".75" />
        <circle cx="208" cy="32" r="8" fill={t.primary} stroke="#fff" strokeWidth="3" />
        <rect x="102" y="76" width="12" height="12" rx="3" fill={t.accent} />
        <path d="M28 98v18M28 98h12l-3 4 3 4H28" fill="none" stroke={t.primaryDark} strokeWidth="3" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-label="بوابة بأقفال وقلوب">
      <rect width="240" height="140" rx="14" fill={t.sky} />
      <rect y="112" width="240" height="28" fill={t.ground} />
      <path d="M78 124V62a42 42 0 0 1 84 0v62Z" fill={t.primaryDark} />
      <path d="M86 124V64a34 34 0 0 1 34-34v94Z" fill={t.primary} />
      <path d="M154 124V64a34 34 0 0 0-34-34v94Z" fill={t.primary} opacity=".85" />
      {[98, 120, 142].map((x, i) => (
        <g key={x} transform={`translate(${x} 82)`}>
          <circle r="9" fill={i === 0 ? t.accent : '#fff'} stroke={t.primaryDark} strokeWidth="2.5" />
          {i === 0 && <path d="M-4 0l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />}
        </g>
      ))}
      {[24, 46, 68].map((x, i) => (
        <path key={x} transform={`translate(${x} 26)`} d="M0 14S-10 7-10 0a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 14-10 14z" fill={i < 2 ? '#E0475B' : 'none'} stroke="#E0475B" strokeWidth="2.5" />
      ))}
    </svg>
  );
}
