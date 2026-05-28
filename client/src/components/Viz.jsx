/**
 * Viz — tiny inline-SVG visualisations (no Chart.js).
 * Sized via viewBox + preserveAspectRatio so they scale into any container.
 *
 * Exports:
 *   <BarChart data={[{label,value,color?}]} max?       />
 *   <Donut value={0..100} color? trackColor?          />
 *   <Sparkline points={[number]} fill? stroke?        />
 *   <StatStrip items={[{label,value,trend?}]}         />
 *   <ProgressBar value={0..100} color? label?         />
 */

const BRAND = '#4f6df5';
const TRACK = '#eef0f8';
const TEXT  = '#111522';
const MUTED = '#8f97ad';

/* ── Horizontal bar chart ─────────────────────────────────────── */
export function BarChart({ data, max, valueFormatter = (v) => v }) {
  const ceiling = max ?? Math.max(...data.map((d) => d.value)) * 1.1;
  const ROW = 36;
  const W = 320;
  const H = data.length * ROW + 8;
  const LABEL_W = 110;
  const BAR_W = W - LABEL_W - 50;

  return (
    <svg
      className="viz__svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d, i) => {
        const w = Math.max(2, (d.value / ceiling) * BAR_W);
        const y = i * ROW + 6;
        const color = d.color || BRAND;
        return (
          <g key={d.label}>
            <text x={0} y={y + 16} fontSize="11" fill={MUTED} fontWeight="500">
              {d.label}
            </text>
            <rect x={LABEL_W} y={y + 6} width={BAR_W} height={14} rx={4} fill={TRACK} />
            <rect x={LABEL_W} y={y + 6} width={w} height={14} rx={4} fill={color}>
              <animate
                attributeName="width"
                from="0"
                to={w}
                dur="600ms"
                fill="freeze"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
              />
            </rect>
            <text x={LABEL_W + w + 6} y={y + 17} fontSize="11" fill={TEXT} fontWeight="600">
              {valueFormatter(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Donut / progress arc ─────────────────────────────────────── */
export function Donut({ value, color = BRAND, trackColor = TRACK, label, sublabel }) {
  const SIZE = 140;
  const R = 58;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - value / 100);

  return (
    <svg
      className="viz__svg"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${value}%`}
    >
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={trackColor} strokeWidth="10" />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={C}
          to={offset}
          dur="900ms"
          fill="freeze"
          calcMode="spline"
          keySplines="0.22 1 0.36 1"
        />
      </circle>
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="22"
        fontWeight="700"
        fill={TEXT}
        letterSpacing="-0.5"
      >
        {label ?? `${value}%`}
      </text>
      {sublabel && (
        <text x="50%" y="64%" textAnchor="middle" fontSize="10" fill={MUTED} fontWeight="500">
          {sublabel}
        </text>
      )}
    </svg>
  );
}

/* ── Sparkline (smoothed area) ────────────────────────────────── */
export function Sparkline({ points, color = BRAND }) {
  const W = 320;
  const H = 90;
  const PAD = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (points.length - 1);

  const coords = points.map((v, i) => {
    const x = PAD + i * step;
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [x, y];
  });

  const linePath = coords
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1][0]} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  const id = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg
      className="viz__svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Trend"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 3.5 : 0} fill={color} />
      ))}
    </svg>
  );
}

/* ── Stat strip (used inside Viz panels) ──────────────────────── */
export function StatStrip({ items }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 8,
        padding: '8px 0 4px',
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
            {it.value}
          </div>
          <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 500, letterSpacing: 0.2 }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Horizontal progress bar (used inside cards) ──────────────── */
export function ProgressBar({ value, color = BRAND, label }) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: MUTED,
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          <span>{label}</span>
          <span style={{ color: TEXT, fontWeight: 600 }}>{value}%</span>
        </div>
      )}
      <div
        style={{
          height: 6,
          background: TRACK,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            borderRadius: 999,
            transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}
