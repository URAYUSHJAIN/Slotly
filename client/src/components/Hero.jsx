/**
 * Hero — centered layout with inline stats strip
 * Stats: 12,400+ / 98% / <3 min / 4.9/5
 */
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './Button.jsx';

const HERO_STATS = [
  { value: '12,400+', label: 'Patients booked'      },
  { value: '98%',     label: 'Show-up rate'          },
  { value: '< 3 min', label: 'Avg. booking time'     },
  { value: '4.9 / 5', label: 'Patient satisfaction'  },
];

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__mesh" aria-hidden="true" />

      <div className="u-container">

        {/* ── Centered copy ─────────────────────────── */}
        <div className="hero__body">

          <span className="hero__eyebrow animate-fade-in">
            <Sparkles size={10} />
            Healthcare scheduling, simplified
          </span>

          <h1 className="hero__title animate-fade-in-up animation-delay-100">
            Find the care<br />
            <span className="hero__title-gradient">you deserve.</span>
          </h1>

          <p className="hero__subtitle animate-fade-in-up animation-delay-200">
            Connect with verified specialists across 50+ fields.
            Pick a slot, get confirmed — in under three minutes.
          </p>

          <div className="hero__actions animate-fade-in-up animation-delay-300">
            <Button variant="primary">
              Book appointment <ArrowRight size={14} />
            </Button>
            <Button variant="secondary">
              Explore specialists
            </Button>
          </div>

        </div>

        {/* ── Stats strip ───────────────────────────── */}
        <div className="hero__stats" role="list" aria-label="Key metrics">
          {HERO_STATS.map((s, i) => (
            <div
              key={s.label}
              className={`hero__stat animation-delay-${(i + 4) * 100}`}
              role="listitem"
            >
              <div className="hero__stat__value">{s.value}</div>
              <div className="hero__stat__label">{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
