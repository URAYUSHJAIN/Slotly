/**
 * DoctorDashboard — "Dashboard" page (doctor view).
 * Tabs: Today | Upcoming | Previous.
 */
import { useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock, Phone, MapPin } from 'lucide-react';
import { fetchDoctorBookedAppointments } from '../../lib/neonApi.js';
import { useAuth } from '../../lib/useAuth.jsx';

const TABS = [
  { key: 'today',    label: 'Today',    emptyMsg: 'You have no appointments today.' },
  { key: 'upcoming', label: 'Upcoming', emptyMsg: 'No upcoming appointments booked yet.' },
  { key: 'previous', label: 'Previous', emptyMsg: 'No past appointments.' },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('today');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const tab = TABS.find((t) => t.key === active);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!user?.id) return;
      try {
        const data = await fetchDoctorBookedAppointments(user.id);
        if (mounted) {
          setAppointments(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load doctor appointments:', err);
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [user?.id]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter(a => {
    const isToday = a.date === todayStr;
    const isPast = a.date < todayStr;
    const isFuture = a.date > todayStr;
    
    if (active === 'today') return isToday;
    if (active === 'upcoming') return isFuture || (isToday && a.status === 'upcoming');
    if (active === 'previous') return isPast || a.status === 'completed' || a.status === 'cancelled';
    return false;
  });

  return (
    <main className="appointments">
      <header className="appointments__head">
        <div>
          <h1 className="appointments__title">
            Dashboard
          </h1>
          <p className="appointments__sub">View your booked patients and schedule</p>
        </div>
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
            Loading dashboard...
          </div>
        ) : filtered.length > 0 ? (
          <div className="appointment-cards">
            {filtered.map(appt => (
              <div key={appt.id} className="appointment-card">
                <div className="appointment-card__header">
                  <div className="appointment-card__doctor-info">
                    <div className="appointment-card__avatar" style={{ background: '#eef8ff', color: '#5a8dff' }}>
                      {(appt.patientName?.[0] || 'P').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="appointment-card__name">{appt.patientName}</h3>
                      <p className="appointment-card__spec">
                        <Phone size={12} style={{ display: 'inline', marginRight: 4 }}/> 
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
                      {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {appt.start}
                    </span>
                  </div>
                  <div className="appointment-card__detail-item">
                    <span className="appointment-card__detail-label">Patient Details</span>
                    <span className="appointment-card__detail-value">
                      {appt.patientGender || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__art" aria-hidden="true">
              <div className="empty-state__icon">
                <Calendar size={28} />
              </div>
              <div className="empty-state__spark">
                <Sparkles size={12} />
              </div>
            </div>
            <div className="empty-state__title">No Appointments</div>
            <div className="empty-state__sub">{tab.emptyMsg}</div>
          </div>
        )}
      </section>
    </main>
  );
}
