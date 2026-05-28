/**
 * App.jsx — Slotly
 * Card grids span the full viewport.
 * Section headers stay in .u-container for readable line lengths.
 */
import {
  Stethoscope, Brain, Heart, Eye, Bone, Baby,
  Activity, Shield, Zap, CheckCircle, ArrowRight,
} from 'lucide-react';

import { Navbar }      from './components/Navbar.jsx';
import { Hero }        from './components/Hero.jsx';
import { ServiceCard } from './components/ServiceCard.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './components/Card.jsx';
import { Button }      from './components/Button.jsx';
import { Badge }       from './components/Badge.jsx';
import { SearchBar }   from './components/SearchBar.jsx';

/* ── Data ──────────────────────────────────────────── */
const SERVICES = [
  { icon: <Stethoscope size={18} />, title: 'General Practice',  description: 'Routine check-ups, referrals, and primary care.',           accentColor: '#eef2ff', iconColor: '#4f6df5' },
  { icon: <Brain size={18} />,       title: 'Neurology',         description: 'Migraine, epilepsy, and neurological disorder management.', accentColor: '#f5f0ff', iconColor: '#9b5de5' },
  { icon: <Heart size={18} />,       title: 'Cardiology',        description: 'Heart assessments, ECGs, and cardiac follow-ups.',          accentColor: '#fff1f1', iconColor: '#ff6b6b' },
  { icon: <Eye size={18} />,         title: 'Ophthalmology',     description: 'Eye exams, prescriptions, and retinal screenings.',         accentColor: '#f0fdf6', iconColor: '#3ccf91' },
  { icon: <Bone size={18} />,        title: 'Orthopaedics',      description: 'Bone, joint, and sports injury consultations.',             accentColor: '#fffbee', iconColor: '#ffb547' },
  { icon: <Baby size={18} />,        title: 'Paediatrics',       description: 'Child wellness, vaccinations, and development reviews.',    accentColor: '#eef8ff', iconColor: '#5a8dff' },
];

const FEATURES = [
  { icon: <Zap size={16} />,      title: 'Instant confirmation', body: 'Real-time slot availability synced with clinic calendars — no back-and-forth emails.',  badge: 'Fast',   badgeVariant: 'primary' },
  { icon: <Shield size={16} />,   title: 'HIPAA compliant',      body: 'Patient data encrypted at rest and in transit. SOC 2 Type II certified infrastructure.',  badge: 'Secure', badgeVariant: 'success' },
  { icon: <Activity size={16} />, title: 'Smart reminders',      body: 'Automated SMS and email reminders that cut no-shows by up to 45%.',                       badge: 'AI',     badgeVariant: 'info'    },
];

/* ── Section header (always constrained) ───────────── */
function SectionHeader({ badge, badgeVariant = 'primary', title, subtitle }) {
  return (
    <div className="u-container" style={{ marginBottom: 28 }}>
      <Badge variant={badgeVariant}>{badge}</Badge>
      <h2
        style={{
          fontSize: 'clamp(22px, 2.8vw, 30px)',
          fontWeight: 700,
          color: '#111522',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginTop: 10,
          marginBottom: subtitle ? 6 : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: '#6d7489', maxWidth: 400, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────── */
export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Page content ─────────────────────────────── */}
      <div className="page-content">

      {/* ── Navbar ──────────────────────────────────── */}
      <Navbar />

      {/* ── Hero (stats included) ───────────────────── */}
      <Hero />

      {/* ── Services ────────────────────────────────── */}
      <section className="section" id="features" style={{ padding: 44 }}>

        <SectionHeader
          badge="Specialties"
          title="Care for every need"
          subtitle="Browse 50+ fields and book in under three minutes."
        />

        {/* Full-viewport card grid */}
        <div className="grid-full">
          <div className="grid-services">
            {SERVICES.map((s, i) => (
              <div key={s.title} className={`animate-fade-in-up animation-delay-${(i + 1) * 100}`}>
                <ServiceCard {...s} />
              </div>
            ))}
          </div>
        </div>

        <div className="u-container" style={{ marginTop: 20 }}>
          <Button variant="secondary" size="sm">
            View all specialties <ArrowRight size={13} />
          </Button>
        </div>

      </section>

      {/* ── Divider ─────────────────────────────────── */}
      <div className="u-container"><div className="divider" /></div>

      {/* ── Why Slotly ──────────────────────────────── */}
      <section className="section" id="how-it-works" style={{ borderTop: '1px solid #e9ecf5', borderBottom: '1px solid #e9ecf5' }}>

        <SectionHeader
          badge="Why Slotly"
          badgeVariant="neutral"
          title="Built for patients who value their time"
          subtitle="And for clinics who value trust."
        />

        {/* Full-viewport feature grid */}
        <div className="grid-full">
          <div className="grid-features">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`animate-fade-in-up animation-delay-${(i + 1) * 100}`}>
                <Card>
                  <CardHeader>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 34, height: 34,
                          borderRadius: 8,
                          background: '#eef2ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#4f6df5',
                          flexShrink: 0,
                        }}
                      >
                        {f.icon}
                      </div>
                      <Badge variant={f.badgeVariant}>{f.badge}</Badge>
                    </div>
                    <CardTitle>{f.title}</CardTitle>
                    <CardDescription>{f.body}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <button
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        fontSize: 12, fontWeight: 600, color: '#4f6df5',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      Learn more <ArrowRight size={12} />
                    </button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── Divider ─────────────────────────────────── */}
      <div className="u-container"><div className="divider" /></div>

      {/* ── Search ──────────────────────────────────── */}
      <section className="section">
        <div className="u-container" style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              fontWeight: 700,
              color: '#111522',
              letterSpacing: '-0.018em',
              marginBottom: 6,
            }}
          >
            Find your specialist
          </h2>
          <p style={{ fontSize: 13, color: '#6d7489', marginBottom: 20 }}>
            Search by symptom, specialty, or doctor name.
          </p>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <SearchBar onSearch={(query) => navigate(`/doctors?q=${encodeURIComponent(query || '')}`)} />
          </div>
        </div>
      </section>

      {/* ── CTA block — full-width ──────────────────── */}
      <section className="section--sm">
        <div className="cta-block">
          <CheckCircle size={32} color="rgba(255,255,255,0.7)" style={{ margin: '0 auto 14px' }} />
          <h2
            style={{
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.015em',
              marginBottom: 8,
            }}
          >
            Ready to simplify your care?
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', marginBottom: 24 }}>
            Join thousands of patients who book smarter with Slotly.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              style={{ background: '#fff', color: '#4f6df5', border: 'none' }}
              onClick={() => navigate('/auth')}
            >
              Create free account
            </button>
            <button 
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.22)' }}
              onClick={() => navigate('/doctors')}
            >
              Book as guest
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer style={{ padding: '28px 0 20px', borderTop: '1px solid #e9ecf5' }}>
        <div
          className="u-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}
        >
          <span style={{ fontSize: 17, fontWeight: 700, color: '#4f6df5', letterSpacing: '-0.025em' }}>
            Slotly
          </span>
          <p className="text-caption" style={{ color: '#8f97ad' }}>© 2026 Slotly. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 18 }}>
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" className="text-caption" style={{ color: '#6d7489', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      </div>{/* end .page-content */}
    </div>
  );
}
