/**
 * PatientsPage — doctor-only view of consulted patients.
 * Currently shows an empty state until the appointments/bookings table is wired up.
 */
import { Navigate } from 'react-router-dom';
import { Users, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/useAuth.jsx';
import { Navbar } from '../components/Navbar.jsx';

export default function PatientsPage() {
  const { status, role } = useAuth();

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div className="page-content">
          <Navbar />
          <div
            className="u-container"
            style={{ padding: '80px 20px', textAlign: 'center', color: '#8f97ad', fontSize: 13 }}
          >
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (status === 'anon') return <Navigate to="/auth" replace />;
  if (role !== 'doctor') return <Navigate to="/appointments" replace />;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-content">
        <Navbar />

        <main className="appointments">
          <header className="appointments__head">
            <div>
              <h1 className="appointments__title">
                My <em>Patients</em>
              </h1>
              <p className="appointments__sub">
                Everyone you've consulted with on Slotly.
              </p>
            </div>
          </header>

          <section className="appointments__panel">
            <div className="empty-state">
              <div className="empty-state__art" aria-hidden="true">
                <div className="empty-state__icon">
                  <Users size={28} />
                </div>
                <div className="empty-state__spark">
                  <Sparkles size={12} />
                </div>
              </div>
              <div className="empty-state__title">No patients yet</div>
              <div className="empty-state__sub">
                Once a patient books one of your slots, they'll appear here.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
