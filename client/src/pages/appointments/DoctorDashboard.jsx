/**
 * DoctorDashboard — doctor's view of booked appointments.
 *
 * Tabs:
 *   Pending  — newly requested bookings (Approve / Reject)
 *   Today    — confirmed appointments for today (Mark Complete / Cancel)
 *   Upcoming — confirmed appointments in the future
 *   Previous — completed / cancelled / rejected, or any past date
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Sparkles, Phone, Check, X, CheckCircle, Loader2,
} from 'lucide-react';
import {
  fetchDoctorBookedAppointments,
  updateAppointmentStatus,
} from '../../lib/neonApi.js';
import { useAuth } from '../../lib/useAuth.jsx';

const TABS = [
  { key: 'pending',  label: 'Pending',  emptyMsg: 'No appointments waiting for approval.' },
  { key: 'today',    label: 'Today',    emptyMsg: 'You have no appointments today.' },
  { key: 'upcoming', label: 'Upcoming', emptyMsg: 'No upcoming appointments booked yet.' },
  { key: 'previous', label: 'Previous', emptyMsg: 'No past appointments.' },
];

function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null); // appointment id being acted on

  const tab = TABS.find((t) => t.key === active);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchDoctorBookedAppointments(user.id);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((a) => {
    const isToday  = a.date === todayStr;
    const isPast   = a.date < todayStr;
    const isFuture = a.date > todayStr;

    if (active === 'pending')  return a.status === 'pending';
    if (active === 'today')    return isToday && a.status === 'upcoming';
    if (active === 'upcoming') return isFuture && a.status === 'upcoming';
    if (active === 'previous') {
      return isPast ||
        a.status === 'completed' ||
        a.status === 'cancelled' ||
        a.status === 'rejected';
    }
    return false;
  });

  const handleAction = async (id, newStatus) => {
    setPendingAction(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      // Optimistic local update — avoids a full refetch round-trip
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error('Action failed:', err);
      alert(`Could not update appointment: ${err.message}`);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className="appointments">
      <header className="appointments__head">
        <div>
          <h1 className="appointments__title">Dashboard</h1>
          <p className="appointments__sub">Approve incoming bookings and manage your daily schedule</p>
        </div>
      </header>

      <div className="appointments__tabs" role="tablist">
        {TABS.map((t) => {
          const count = appointments.filter((a) => {
            const isToday  = a.date === todayStr;
            const isPast   = a.date < todayStr;
            const isFuture = a.date > todayStr;
            if (t.key === 'pending')  return a.status === 'pending';
            if (t.key === 'today')    return isToday && a.status === 'upcoming';
            if (t.key === 'upcoming') return isFuture && a.status === 'upcoming';
            if (t.key === 'previous') {
              return isPast || a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected';
            }
            return false;
          }).length;

          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === active}
              className={`appointments__tab ${t.key === active ? 'is-active' : ''}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
              {count > 0 && (
                <span style={{
                  marginLeft: 6,
                  background: t.key === active ? '#4f6df5' : '#e9ecf5',
                  color: t.key === active ? '#fff' : '#6d7489',
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <section className="appointments__panel">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#8f97ad', fontSize: 14 }}>
            Loading dashboard...
          </div>
        ) : filtered.length > 0 ? (
          <div className="appointment-cards">
            {filtered.map((appt) => {
              const acting = pendingAction === appt.id;
              return (
                <div key={appt.id} className="appointment-card">
                  <div className="appointment-card__header">
                    <div className="appointment-card__doctor-info">
                      <div
                        className="appointment-card__avatar"
                        style={{ background: '#eef8ff', color: '#5a8dff' }}
                      >
                        {(appt.patientName?.[0] || 'P').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="appointment-card__name">{appt.patientName}</h3>
                        <p className="appointment-card__spec">
                          <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {appt.patientMobile || 'No phone'}
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
                      <span className="appointment-card__detail-label">Patient</span>
                      <span className="appointment-card__detail-value">
                        {appt.patientGender || 'Unknown'}
                      </span>
                    </div>
                    <div className="appointment-card__detail-item">
                      <span className="appointment-card__detail-label">Fee</span>
                      <span className="appointment-card__detail-value">
                        ₹{Number(appt.fee).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {(appt.status === 'pending' || appt.status === 'upcoming') && (
                    <div style={{
                      display: 'flex', gap: 8, marginTop: 16, paddingTop: 12,
                      borderTop: '1px solid #f4f5fb', flexWrap: 'wrap',
                    }}>
                      {appt.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(appt.id, 'upcoming')}
                            style={btnStyle('#1a9e66', '#f0fdf6')}
                          >
                            {acting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(appt.id, 'rejected')}
                            style={btnStyle('#c93a3a', '#fff1f1')}
                          >
                            {acting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                            Reject
                          </button>
                        </>
                      )}
                      {appt.status === 'upcoming' && (
                        <>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(appt.id, 'completed')}
                            style={btnStyle('#1a9e66', '#f0fdf6')}
                          >
                            {acting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Mark Complete
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(appt.id, 'cancelled')}
                            style={btnStyle('#c93a3a', '#fff1f1')}
                          >
                            {acting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                            Cancel
                          </button>
                        </>
                      )}
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
            <div className="empty-state__title">No Appointments</div>
            <div className="empty-state__sub">{tab.emptyMsg}</div>
          </div>
        )}
      </section>
    </main>
  );
}

function btnStyle(fg, bg) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: bg,
    color: fg,
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  };
}
