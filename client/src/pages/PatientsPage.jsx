/**
 * PatientsPage — doctor-only directory of consulted patients.
 *
 * Lists every distinct patient who has any appointment with the signed-in
 * doctor. Searchable by name / mobile.
 */
import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users, Sparkles, Search, Phone, Calendar, UserRound,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth.jsx';
import { Navbar } from '../components/Navbar.jsx';
import { fetchDoctorPatients } from '../lib/neonApi.js';

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function PatientsPage() {
  const { status, role, user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await fetchDoctorPatients(user.id);
        if (mounted) setPatients(data);
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (status === 'authed' && role === 'doctor') load();
    return () => { mounted = false; };
  }, [user?.id, status, role]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) =>
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.mobile?.includes(q)
    );
  }, [patients, search]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div className="page-content">
          <Navbar />
          <div className="u-container" style={{
            padding: '80px 20px', textAlign: 'center', color: '#8f97ad', fontSize: 13,
          }}>
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

          {patients.length > 0 && (
            <div className="doctors-page__toolbar" style={{ marginBottom: 24 }}>
              <div className="doctors-search">
                <Search size={15} className="doctors-search__icon" />
                <input
                  type="text"
                  className="doctors-search__input"
                  placeholder="Search by name or mobile…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          <section className="appointments__panel">
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#8f97ad', fontSize: 14 }}>
                Loading patients…
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__art" aria-hidden="true">
                  <div className="empty-state__icon"><Users size={28} /></div>
                  <div className="empty-state__spark"><Sparkles size={12} /></div>
                </div>
                <div className="empty-state__title">
                  {search ? 'No patients match your search' : 'No patients yet'}
                </div>
                <div className="empty-state__sub">
                  {search
                    ? 'Try a different name or number.'
                    : "Once a patient books one of your slots, they'll appear here."}
                </div>
              </div>
            ) : (
              <div className="doctors-grid">
                {filtered.map((p) => {
                  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
                  const initials = (p.firstName?.[0] || '?').toUpperCase();
                  const age = calcAge(p.dateOfBirth);

                  return (
                    <div key={p.id} className="doctor-card">
                      <div className="doctor-card__accent" style={{ background: '#5a8dff' }} />
                      <div className="doctor-card__header">
                        <div
                          className="doctor-card__avatar"
                          style={{ background: '#eef8ff', color: '#5a8dff' }}
                        >
                          {initials}
                        </div>
                        <div className="doctor-card__name-block">
                          <div className="doctor-card__name">{fullName || 'Unknown Patient'}</div>
                          <div className="doctor-card__spec" style={{ color: '#5a8dff' }}>
                            <UserRound size={11} />
                            {p.gender || 'Not specified'}
                            {age !== null && ` · ${age}y`}
                          </div>
                        </div>
                      </div>

                      <div className="doctor-card__details">
                        <div className="doctor-card__detail">
                          <Phone size={13} />
                          <span>{p.mobile || '—'}</span>
                        </div>
                        <div className="doctor-card__detail">
                          <Calendar size={13} />
                          <span>
                            Last visit:{' '}
                            {new Date(p.lastVisit + 'T00:00:00').toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="doctor-card__footer">
                        <div className="doctor-card__price" style={{ color: '#5a8dff' }}>
                          {p.totalAppointments} appt{p.totalAppointments !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
