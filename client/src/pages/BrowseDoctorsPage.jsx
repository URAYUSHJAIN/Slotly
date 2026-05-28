/**
 * BrowseDoctorsPage — patient-facing doctor catalog.
 *
 * Fetches all doctors (profiles + doctor details) from Neon and
 * displays them in a searchable/filterable grid. Clicking "Book"
 * opens the BookingModal overlay.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Search, Stethoscope, GraduationCap, Briefcase,
  IndianRupee, ArrowRight, UserRound, Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth.jsx';
import { fetchDoctors } from '../lib/neonApi.js';
import { Navbar } from '../components/Navbar.jsx';
import BookingModal from '../components/BookingModal.jsx';

/* ── Specialty color map for visual variety ─────────────── */
const SPEC_COLORS = [
  { bg: '#eef2ff', fg: '#4f6df5' },
  { bg: '#f5f0ff', fg: '#9b5de5' },
  { bg: '#fff1f1', fg: '#ff6b6b' },
  { bg: '#f0fdf6', fg: '#3ccf91' },
  { bg: '#fffbee', fg: '#cc8b00' },
  { bg: '#eef8ff', fg: '#5a8dff' },
  { bg: '#fef3f8', fg: '#e05297' },
  { bg: '#f4fffe', fg: '#17b89c' },
];

function specColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return SPEC_COLORS[Math.abs(hash) % SPEC_COLORS.length];
}

/* ── Fallback seed doctors (shown when DB is empty or on error) ─ */
const SEED_DOCTORS = [
  { id: 'seed-1', firstName: 'Arjun', lastName: 'Mehta', speciality: 'Cardiology', qualification: 'MD, DM Cardiology', experience: '12 years', appointmentPrice: 800 },
  { id: 'seed-2', firstName: 'Priya', lastName: 'Sharma', speciality: 'Neurology', qualification: 'MD, DM Neurology', experience: '9 years', appointmentPrice: 1000 },
  { id: 'seed-3', firstName: 'Rahul', lastName: 'Gupta', speciality: 'Orthopaedics', qualification: 'MS Ortho', experience: '15 years', appointmentPrice: 600 },
  { id: 'seed-4', firstName: 'Sneha', lastName: 'Reddy', speciality: 'Paediatrics', qualification: 'MD Paediatrics', experience: '7 years', appointmentPrice: 500 },
  { id: 'seed-5', firstName: 'Karan', lastName: 'Singh', speciality: 'General Practice', qualification: 'MBBS, MD', experience: '10 years', appointmentPrice: 400 },
  { id: 'seed-6', firstName: 'Meera', lastName: 'Nair', speciality: 'Ophthalmology', qualification: 'MS Ophthalmology', experience: '8 years', appointmentPrice: 700 },
];

export default function BrowseDoctorsPage() {
  const { status, role } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalDoctor, setModalDoctor] = useState(null);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDoctors();
      setDoctors(data.length ? data : SEED_DOCTORS);
      setError(null);
    } catch (err) {
      console.warn('fetchDoctors failed, using seed data:', err.message);
      setDoctors(SEED_DOCTORS);
      setError(null); // Use seed silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authed') loadDoctors();
  }, [status, loadDoctors]);

  /* Filter by search query */
  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        d.firstName?.toLowerCase().includes(q) ||
        d.lastName?.toLowerCase().includes(q) ||
        d.speciality?.toLowerCase().includes(q) ||
        d.qualification?.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  /* Unique specialties for quick-filter chips */
  const specialties = useMemo(
    () => [...new Set(doctors.map((d) => d.speciality).filter(Boolean))],
    [doctors]
  );

  const handleBook = (booking) => {
    // In a real app this would POST to the DB. For now just redirect.
    navigate('/appointments');
  };

  /* ── Guards ─────────────────────────────────────────── */
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div className="page-content">
          <Navbar />
          <div className="u-container" style={{ padding: '80px 20px', textAlign: 'center', color: '#8f97ad', fontSize: 13 }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (status === 'anon') return <Navigate to="/auth" replace />;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-content">
        <Navbar />

        <main className="doctors-page">
          {/* ── Header ─────────────────────────────────── */}
          <header className="doctors-page__head">
            <div>
              <h1 className="doctors-page__title">
                Find Your <em>Doctor</em>
              </h1>
              <p className="doctors-page__sub">
                Browse our network of specialists and book an appointment in seconds.
              </p>
            </div>
          </header>

          {/* ── Search + filter chips ──────────────────── */}
          <div className="doctors-page__toolbar">
            <div className="doctors-search">
              <Search size={15} className="doctors-search__icon" />
              <input
                type="text"
                className="doctors-search__input"
                placeholder="Search by name, speciality, or qualification…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {specialties.length > 1 && (
              <div className="doctors-page__chips">
                <button
                  type="button"
                  className={`doctors-chip ${!search ? 'is-active' : ''}`}
                  onClick={() => setSearch('')}
                >
                  All
                </button>
                {specialties.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`doctors-chip ${search === s ? 'is-active' : ''}`}
                    onClick={() => setSearch(search === s ? '' : s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Grid ───────────────────────────────────── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8f97ad', fontSize: 13 }}>
              Fetching doctors…
            </div>
          ) : filtered.length === 0 ? (
            <div className="doctors-page__empty">
              <div className="empty-state">
                <div className="empty-state__art" aria-hidden="true">
                  <div className="empty-state__icon">
                    <UserRound size={28} />
                  </div>
                  <div className="empty-state__spark">
                    <Sparkles size={12} />
                  </div>
                </div>
                <div className="empty-state__title">No doctors found</div>
                <div className="empty-state__sub">
                  {search
                    ? `No results for "${search}". Try a different search.`
                    : 'No doctors available at the moment.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="doctors-grid">
              {filtered.map((doc, i) => {
                const color = specColor(doc.speciality);
                const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ');
                const initials = (doc.firstName?.[0] || '?').toUpperCase();

                return (
                  <div
                    key={doc.id}
                    className={`doctor-card animate-fade-in-up animation-delay-${Math.min((i + 1) * 100, 600)}`}
                  >
                    {/* Top accent */}
                    <div className="doctor-card__accent" style={{ background: color.fg }} />

                    {/* Header */}
                    <div className="doctor-card__header">
                      <div className="doctor-card__avatar" style={{ background: color.bg, color: color.fg }}>
                        {initials}
                      </div>
                      <div className="doctor-card__name-block">
                        <div className="doctor-card__name">Dr. {fullName}</div>
                        <div className="doctor-card__spec" style={{ color: color.fg }}>
                          <Stethoscope size={11} />
                          {doc.speciality}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="doctor-card__details">
                      <div className="doctor-card__detail">
                        <GraduationCap size={13} />
                        <span>{doc.qualification || '—'}</span>
                      </div>
                      <div className="doctor-card__detail">
                        <Briefcase size={13} />
                        <span>{doc.experience || '—'}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="doctor-card__footer">
                      <div className="doctor-card__price">
                        <IndianRupee size={14} />
                        <span>{Number(doc.appointmentPrice).toLocaleString('en-IN')}</span>
                      </div>
                      <button
                        type="button"
                        className="doctor-card__book"
                        onClick={() => setModalDoctor(doc)}
                      >
                        Book <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Booking Modal ─────────────────────────────── */}
      {modalDoctor && (
        <BookingModal
          doctor={modalDoctor}
          onClose={() => setModalDoctor(null)}
          onBook={handleBook}
        />
      )}
    </div>
  );
}
