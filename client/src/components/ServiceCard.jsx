/**
 * ServiceCard — design.md §16
 * Icon top-left | Title | Description | Action icon top-right
 * padding: 24px | border-radius: 24px | min-height: 180px
 */
import { ArrowUpRight } from 'lucide-react';

export function ServiceCard({
  icon,
  title,
  description,
  accentColor = '#eef2ff',
  iconColor   = '#4f6df5',
  onClick,
  className = '',
}) {
  return (
    <div className={`service-card ${className}`} onClick={onClick}>
      <div className="service-card__top">
        {/* Icon — top left */}
        <div
          className="service-card__icon-wrap"
          style={{ background: accentColor }}
          aria-hidden="true"
        >
          {icon && (
            <span style={{ color: iconColor, display: 'flex' }}>
              {icon}
            </span>
          )}
        </div>

        {/* Action — top right */}
        <button
          className="service-card__action"
          aria-label={`Learn more about ${title}`}
          onClick={e => { e.stopPropagation(); onClick?.(); }}
        >
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Content */}
      <p className="service-card__title">{title}</p>
      <p className="service-card__description">{description}</p>
    </div>
  );
}
