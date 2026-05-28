/**
 * AboutPage — single-viewport, no scroll.
 * Layout: mission + 4 stat tiles on the left, growth sparkline + donut on the right.
 */
import { Heart, Globe, Users, Award, ArrowRight } from 'lucide-react';

import { Navbar } from '../components/Navbar.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Sparkline, Donut, StatStrip } from '../components/Viz.jsx';

const PILLARS = [
  { icon: <Heart  size={14} />, title: 'Patient first',  desc: 'Care decisions over conversion metrics.', color: '#ff6b6b', accent: '#fff1f1' },
  { icon: <Globe  size={14} />, title: 'Global mindset', desc: '50+ specialties, multi-region cloud.',   color: '#5a8dff', accent: '#eef8ff' },
  { icon: <Users  size={14} />, title: 'Built with teams', desc: 'Designed alongside real clinic staff.', color: '#9b5de5', accent: '#f5f0ff' },
  { icon: <Award  size={14} />, title: 'Trust earned',     desc: 'SOC 2 Type II, HIPAA aligned.',         color: '#3ccf91', accent: '#f0fdf6' },
];

const MONTHLY_PATIENTS = [820, 980, 1140, 1480, 1820, 2350, 3020, 4180, 5500, 7200, 9800, 12400];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-content">
        <Navbar />

        <main className="page-fit">
          <div className="page-fit__head">
            <h1 className="page-fit__title">Healthcare scheduling, reimagined.</h1>
            <p className="page-fit__subtitle">
              We're building the booking layer for modern clinics — so patients spend less time waiting and more time being cared for.
            </p>
          </div>

          <div className="page-fit__body page-fit__body--split">
            <div className="tile-grid">
              {PILLARS.map((p) => (
                <div key={p.title} className="tile">
                  <div className="tile__icon" style={{ background: p.accent, color: p.color }}>
                    {p.icon}
                  </div>
                  <div className="tile__title">{p.title}</div>
                  <div className="tile__desc">{p.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 12, minHeight: 0 }}>
              <div className="viz">
                <div className="viz__head">
                  <span className="viz__title">Patients booked</span>
                  <span className="viz__caption">last 12 months</span>
                </div>
                <Sparkline points={MONTHLY_PATIENTS} color="#4f6df5" />
                <StatStrip
                  items={[
                    { label: 'This month', value: '12.4k' },
                    { label: 'YoY growth', value: '+1410%' },
                    { label: 'Countries',  value: '7' },
                  ]}
                />
              </div>

              <div className="viz" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                <div style={{ width: 96, height: 96, flexShrink: 0 }}>
                  <Donut value={98} color="#3ccf91" label="98%" sublabel="show-up" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111522', marginBottom: 4 }}>
                    The metric we obsess over.
                  </div>
                  <div style={{ fontSize: 12, color: '#6d7489', lineHeight: 1.55 }}>
                    Show-up rate is the truest signal that scheduling actually works for both sides — patients and clinics.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="page-fit__foot">
            <span style={{ fontSize: 12, color: '#8f97ad' }}>
              Built remotely. Patient-funded. Quietly profitable.
            </span>
            <div className="page-fit__foot-actions">
              <Button variant="secondary" size="sm">Read the changelog</Button>
              <Button variant="primary" size="sm">Join us <ArrowRight size={12} /></Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
