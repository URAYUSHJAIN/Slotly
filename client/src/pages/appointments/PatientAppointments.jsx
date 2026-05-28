/**
 * PatientAppointments — "My Appointments" page (patient view).
 * Tabs: Upcoming | Previous | Today.
 */
import { useState, useEffect } from 'react';
import { Calendar, Sparkles, ArrowRight, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchPatientAppointments } from '../../lib/neonApi.js';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', emptyMsg: 'You have no upcoming appointments.' },
  { key: 'previous', label: 'Previous', emptyMsg: 'No past appointments yet.' },
  { key: 'today',    label: 'Today',    emptyMsg: 'Nothing on the schedule for today.' },
];

export default function PatientAppointments() {
  const [active, setActive] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const tab = TABS.find((t) => t.key === active);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const data = await fetchPatientAppointments();
        if (mounted) {
          setAppointments(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load appointments:', err);
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

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
            {filtered.map(appt => (
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
                      {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {appt.start}
                    </span>
                  </div>
                  <div className="appointment-card__detail-item">
                    <span className="appointment-card__detail-label">Fee</span>
                    <span className="appointment-card__detail-value">₹{Number(appt.fee).toLocaleString('en-IN')}</span>
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
