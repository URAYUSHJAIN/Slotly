/**
 * HowItWorksPage — single-viewport, no scroll.
 * Layout: 3-step rail at top, two-panel viz (donut + sparkline) below.
 */
import { Calendar, Search, CheckCircle, ArrowRight } from 'lucide-react';

import { Navbar } from '../components/Navbar.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Donut, Sparkline, StatStrip } from '../components/Viz.jsx';

const STEPS = [
  { idx: '01', icon: <Search size={14} />,      title: 'Search specialists', desc: 'Filter by specialty, location, insurance, and availability in seconds.' },
  { idx: '02', icon: <Calendar size={14} />,    title: 'Pick a time',        desc: 'Live schedules show the best match — no back-and-forth calls.' },
  { idx: '03', icon: <CheckCircle size={14} />, title: 'Get confirmed',      desc: 'Instant confirmation and reminders keep everyone aligned.' },
];

const WEEKLY_BOOKINGS = [42, 58, 51, 73, 88, 96, 112, 124, 138, 156, 168, 184];

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-content">
        <Navbar />

        <main className="page-fit">
          <div className="page-fit__head">
            <h1 className="page-fit__title">A booking flow that feels effortless.</h1>
            <p className="page-fit__subtitle">
              Three steps. Average completion under three minutes.
            </p>
          </div>

          <div className="page-fit__body" style={{ gridTemplateRows: 'auto 1fr', gap: 16 }}>
            <div className="step-rail">
              {STEPS.map((s) => (
                <div key={s.idx} className="step-rail__node">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="step-rail__index">{s.idx}</span>
                    <span style={{ color: '#4f6df5', display: 'flex' }}>{s.icon}</span>
                  </div>
                  <div className="step-rail__title">{s.title}</div>
                  <div className="step-rail__desc">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="page-fit__body--split" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, minHeight: 0 }}>
              <div className="viz" style={{ alignItems: 'center', textAlign: 'center' }}>
                <div className="viz__head" style={{ width: '100%' }}>
                  <span className="viz__title">Avg. completion</span>
                  <span className="viz__caption">last 30 days</span>
                </div>
                <Donut value={94} color="#3ccf91" label="2:48" sublabel="minutes" />
                <div style={{ fontSize: 11, color: '#6d7489', marginTop: -4 }}>
                  94% of bookings finish under 3 minutes.
                </div>
              </div>

              <div className="viz">
                <div className="viz__head">
                  <span className="viz__title">Bookings per week</span>
                  <span className="viz__caption">12-week trend</span>
                </div>
                <Sparkline points={WEEKLY_BOOKINGS} color="#4f6df5" />
                <StatStrip
                  items={[
                    { label: 'This week', value: '184' },
                    { label: 'Growth',    value: '+38%' },
                    { label: 'No-shows',  value: '4.2%' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="page-fit__foot">
            <span style={{ fontSize: 12, color: '#8f97ad' }}>
              From discovery to follow-up — one experience.
            </span>
            <div className="page-fit__foot-actions">
              <Button variant="secondary" size="sm">See a walkthrough</Button>
              <Button variant="primary" size="sm">Start booking <ArrowRight size={12} /></Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
