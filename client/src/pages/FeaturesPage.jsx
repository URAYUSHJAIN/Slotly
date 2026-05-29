/**
 * FeaturesPage — single-viewport, no scroll.
 * Layout: 6 feature tiles on the left, impact bar-chart on the right.
 */
import {
  Calendar, MessageSquare, Shield, Zap, LineChart, Users, ArrowRight,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { BarChart } from '../components/Viz.jsx';
import { useAuth } from '../lib/useAuth.jsx';

const FEATURES = [
  { title: 'Real-time availability', desc: 'Live calendar sync — no double bookings.', icon: <Calendar size={14} />,      accent: '#eef2ff', color: '#4f6df5' },
  { title: 'Smart reminders',         desc: 'SMS + email nudges cut no-shows.',          icon: <MessageSquare size={14} />, accent: '#eef8ff', color: '#5a8dff' },
  { title: 'Privacy first',           desc: 'Encrypted records, clinic-grade access.',   icon: <Shield size={14} />,       accent: '#f0fdf6', color: '#3ccf91' },
  { title: 'Fast onboarding',         desc: 'Import providers in minutes.',              icon: <Zap size={14} />,          accent: '#fff1f1', color: '#ff6b6b' },
  { title: 'Performance insights',    desc: 'Trends and follow-up rates at a glance.',   icon: <LineChart size={14} />,    accent: '#fffbee', color: '#ffb547' },
  { title: 'Team workflows',          desc: 'Front-desk, providers, admin in sync.',     icon: <Users size={14} />,        accent: '#f5f0ff', color: '#9b5de5' },
];

const IMPACT = [
  { label: 'No-shows reduced',  value: 45, color: '#4f6df5' },
  { label: 'Booking time',      value: 78, color: '#5a8dff' },
  { label: 'Admin calls',       value: 62, color: '#3ccf91' },
  { label: 'Patient satisfaction', value: 98, color: '#ffb547' },
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const goBooking = () => navigate(status === 'authed' ? '/appointments' : '/auth');

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-content">
        <Navbar />

        <main className="page-fit">
          <div className="page-fit__head">
            <h1 className="page-fit__title">Everything you need to book care faster.</h1>
            <p className="page-fit__subtitle">
              Discovery, scheduling, and follow-ups — one continuous flow for patients and clinics.
            </p>
          </div>

          <div className="page-fit__body page-fit__body--split">
            <div className="tile-grid tile-grid--cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="tile">
                  <div className="tile__icon" style={{ background: f.accent, color: f.color }}>
                    {f.icon}
                  </div>
                  <div className="tile__title">{f.title}</div>
                  <div className="tile__desc">{f.desc}</div>
                </div>
              ))}
            </div>

            <div className="viz">
              <div className="viz__head">
                <span className="viz__title">Slotly impact</span>
                <span className="viz__caption">vs. industry average</span>
              </div>
              <BarChart data={IMPACT} max={100} valueFormatter={(v) => `${v}%`} />
              <div className="viz__legend">
                <span><i className="viz__legend-dot" style={{ background: '#4f6df5' }} />Operations</span>
                <span><i className="viz__legend-dot" style={{ background: '#3ccf91' }} />Patient care</span>
              </div>
            </div>
          </div>

          <div className="page-fit__foot">
            <span style={{ fontSize: 12, color: '#8f97ad' }}>
              Built for clinics that value trust — and patients who value their time.
            </span>
            <div className="page-fit__foot-actions">
              <Button variant="secondary" size="sm" onClick={goBooking}>Talk to a clinic</Button>
              <Button variant="primary" size="sm" onClick={goBooking}>Start booking <ArrowRight size={12} /></Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
