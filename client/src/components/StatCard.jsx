/**
 * StatCard — design.md §12 Floating Cards / Stats
 * Glass surface | Icon | Value + label
 */
export function StatCard({ icon, value, label, accentColor = '#eef2ff', iconColor = '#4f6df5' }) {
  return (
    <div className="stat-card">
      <div
        className="stat-card__icon"
        style={{ background: accentColor }}
        aria-hidden="true"
      >
        <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
      </div>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}
