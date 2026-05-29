/**
 * PricingPage — single-viewport, no scroll.
 * Layout: 3 plan cards in a row, plan-comparison bar chart below.
 */
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { BarChart } from '../components/Viz.jsx';
import { useAuth } from '../lib/useAuth.jsx';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'small clinics',
    desc: 'Launch quickly with core scheduling.',
    cta: 'Start free',
    features: ['1 location, 3 providers', 'Live calendar sync', 'Email reminders'],
  },
  {
    name: 'Growth',
    price: '$49',
    suffix: '/mo',
    period: 'per location',
    desc: 'Automation, SMS reminders, dashboards.',
    cta: 'Start trial',
    featured: true,
    features: ['Unlimited providers', 'SMS + email reminders', 'Waitlist automation', 'Dashboards'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'multi-site groups',
    desc: 'Advanced security, integrations, SLA.',
    cta: 'Talk to sales',
    features: ['Custom workflows', 'Dedicated success mgr', 'Priority SLA'],
  },
];

const COMPARE = [
  { label: 'Locations',       value: 100, color: '#9b5de5' },
  { label: 'Reminder channels', value: 80, color: '#5a8dff' },
  { label: 'Reporting depth',   value: 90, color: '#3ccf91' },
  { label: 'Integrations',      value: 70, color: '#4f6df5' },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const goBooking = () => navigate(status === 'authed' ? '/appointments' : '/auth');

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-content">
        <Navbar />

        <main className="page-fit">
          <div className="page-fit__head">
            <h1 className="page-fit__title">Plans that scale with your clinic.</h1>
            <p className="page-fit__subtitle">
              Start free, upgrade when you're ready to automate.
            </p>
          </div>

          <div className="page-fit__body" style={{ gridTemplateRows: '1fr auto', gap: 16 }}>
            <div className="plan-row">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`plan-card ${p.featured ? 'plan-card--featured' : ''}`}
                >
                  {p.featured && <span className="plan-card__badge">Most popular</span>}
                  <div className="plan-card__name">{p.name}</div>
                  <div className="plan-card__price">
                    {p.price}
                    {p.suffix && <small>{p.suffix}</small>}
                  </div>
                  <div className="plan-card__desc">
                    {p.period && <span style={{ color: '#8f97ad' }}>{p.period} — </span>}
                    {p.desc}
                  </div>
                  <div className="plan-card__features">
                    {p.features.map((f) => (
                      <div key={f} className="plan-card__feature">
                        <CheckCircle size={12} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="plan-card__cta">
                    <Button variant={p.featured ? 'primary' : 'secondary'} size="sm">
                      {p.cta} <ArrowRight size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="viz" style={{ maxHeight: 180 }}>
              <div className="viz__head">
                <span className="viz__title">Growth plan — feature coverage</span>
                <span className="viz__caption">Most popular tier</span>
              </div>
              <BarChart data={COMPARE} max={100} valueFormatter={(v) => `${v}%`} />
            </div>
          </div>

          <div className="page-fit__foot">
            <span style={{ fontSize: 12, color: '#8f97ad' }}>
              Switch tiers anytime. Patient bookings are always free.
            </span>
            <div className="page-fit__foot-actions">
              <Button variant="secondary" size="sm" onClick={goBooking}>Contact sales</Button>
              <Button variant="primary" size="sm" onClick={goBooking}>Start free <ArrowRight size={12} /></Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
