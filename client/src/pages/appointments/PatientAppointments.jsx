/**
 * PatientAppointments — "My Appointments" page (patient view).
 *
 * Tabs:
 *   Upcoming — pending + upcoming bookings in future or today
 *   Today    — anything happening today
 *   Previous — past dates, or any completed / cancelled / rejected status
 */
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Sparkles, ArrowRight, Clock, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchPatientAppointments,
  updateAppointmentStatus,
} from '../../lib/neonApi.js';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', emptyMsg: 'You have no upcoming appointments.' },
  { key: 'today',    label: 'Today',    emptyMsg: 'Nothing on the schedule for today.' },
  { key: 'previous', label: 'Previous', emptyMsg: 'No past appointments yet.' },
];

function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function PatientAppointments() {
  const [active, setActive] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);

  const tab = TABS.find((t) => t.key === active);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPatientAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((a) => {
    const isToday  = a.date === todayStr;
    const isPast   = a.date < todayStr;
    const isFuture = a.date > todayStr;
    const isLive   = a.status === 'pending' || a.status === 'upcoming';

    if (active === 'today')    return isToday  && isLive;
    if (active === 'upcoming') return (isFuture && isLive) || (isToday && isLive);
    if (active === 'previous') {
      return isPast ||
        a.status === 'completed' ||
        a.status === 'cancelled' ||
        a.status === 'rejected';
    }
    return false;
  });

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment? This cannot be undone.')) return;
    setPendingAction(id);
    try {
      await updateAppointmentStatus(id, 'cancelled');
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
    } catch (err) {
      console.error('Cancel failed:', err);
      alert(`Could not cancel: ${err.message}`);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className="appointments">
      <header className="appointments__head">
        <div>
          <h1 className="appointments__title">
            My <em>Appointments</em>
          </h1>
          <p className="appointments__sub">Track and manage your consultation history</p>
        </div>
        <Link to="/doctors" className="btn btn--primary btn--sm">
          Book new <ArrowRight size={12} />
        </Link>
      </header>

      <div className="appointments__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === active}
            className={`appointments__tab ${t.key === active ? 'is-active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="appointments__panel">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#8f97ad', fontSize: 14 }}>
            Loading appointments...
          </div>
        ) : filtered.length > 0 ? (
          <div className="appointment-cards">
            {filtered.map((appt) => {
              const acting = pendingAction === appt.id;
              const cancellable = appt.status === 'pending' || appt.status === 'upcoming';
              return (
                <div key={appt.id} className="appointment-card">
                  <div className="appointment-card__header">
                    <div className="appointment-card__doctor-info">
                      <div className="appointment-card__avatar">
                        {(appt.doctorName?.[0] || 'D').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="appointment-card__name">Dr. {appt.doctorName}</h3>
                        <p className="appointment-card__spec">
                          <Clock size={14} /> {appt.speciality}
                        </p>
                      </div>
                    </div>
                    <div className={`appointment-card__status is-${appt.status}`}>
                      {appt.status}
                    </div>
                  </div>

                  <div className="appointment-card__divider" />

                  <div className="appointment-card__details">
                    <div className="appointment-card__detail-item">
                      <span className="appointment-card__detail-label">Date & Time</span>
                      <span className="appointment-card__detail-value">
                        {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}{' '}at {formatTime(appt.start)}
                      </span>
                    </div>
                    <div className="appointment-card__detail-item">
                      <span className="appointment-card__detail-label">Fee</span>
                      <span className="appointment-card__detail-value">
                        ₹{Number(appt.fee).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {cancellable && (
                    <div style={{
                      display: 'flex', gap: 8, marginTop: 16, paddingTop: 12,
                      borderTop: '1px solid #f4f5fb',
                    }}>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => handleCancel(appt.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#fff1f1',
                          color: '#c93a3a',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {acting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                        Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__art" aria-hidden="true">
              <div className="empty-state__icon"><Calendar size={28} /></div>
              <div className="empty-state__spark"><Sparkles size={12} /></div>
            </div>
            <div className="empty-state__title">No Results Found</div>
            <div className="empty-state__sub">{tab.emptyMsg}</div>
            <div style={{ marginTop: 16 }}>
              <Link to="/doctors" className="btn btn--primary btn--sm">
                Find a specialist <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
