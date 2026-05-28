/**
 * DoctorSchedule — "Manage Availability Slots" page (doctor view).
 * Slots grouped by date. Add Slot opens an inline form.
 * Now using the real database via neonApi.
 */
import { useMemo, useState, useEffect } from 'react';
import { Plus, Clock, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { useAuth } from '../../lib/useAuth.jsx';
import { fetchDoctorSlots, addDoctorAvailability, removeDoctorAvailability } from '../../lib/neonApi.js';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    day: d.getDate(),
    month: MONTHS[d.getMonth()],
    year: d.getFullYear(),
    weekday: WEEKDAYS[d.getDay()],
  };
}

function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function DoctorSchedule() {
  const { profile, user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', start: '', end: '', label: '' });

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    'Doctor';

  // Load existing availability
  useEffect(() => {
    async function loadSlots() {
      try {
        if (!user?.id) return;
        setLoading(true);
        const data = await fetchDoctorSlots(user.id);
        setSlots(data || []);
      } catch (err) {
        console.error("Failed to load slots", err);
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, [user?.id]);

  const grouped = useMemo(() => {
    const byDate = new Map();
    [...slots]
      .sort((a, b) => (a.available_date + a.start_time).localeCompare(b.available_date + b.start_time))
      .forEach((s) => {
        if (!byDate.has(s.available_date)) byDate.set(s.available_date, []);
        byDate.get(s.available_date).push(s);
      });
    return Array.from(byDate.entries());
  }, [slots]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.date || !form.start || !form.end) return;
    
    setSaving(true);
    try {
      const newSlot = await addDoctorAvailability({
        doctor_id: user.id,
        available_date: form.date,
        start_time: form.start,
        end_time: form.end,
        label: form.label || 'Consultation'
      });
      setSlots((prev) => [...prev, newSlot]);
      setForm({ date: '', start: '', end: '', label: '' });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add slot", err);
      alert("Failed to add slot. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeSlot = async (id) => {
    try {
      await removeDoctorAvailability(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to remove slot", err);
      alert("Failed to remove slot.");
    }
  };

  return (
    <main className="schedule">
      <header className="schedule__head">
        <div>
          <h1 className="schedule__title">
            Manage <em>Availability Slots</em>
          </h1>
          <p className="schedule__sub">
            Set your weekly recurring availability for patient consultations.
          </p>
          <p style={{ fontSize: 11, color: '#8f97ad', marginTop: 6 }}>
            Signed in as <strong style={{ color: '#4e5568' }}>{fullName}</strong>
          </p>
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add Slot
        </button>
      </header>

      {showForm && (
        <form className="schedule__form" onSubmit={handleAdd}>
          <div className="schedule__form-row">
            <label>
              <span>Date</span>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              <span>Start</span>
              <input
                type="time"
                required
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </label>
            <label>
              <span>End</span>
              <input
                type="time"
                required
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </label>
            <label className="schedule__form-label-full">
              <span>Label</span>
              <input
                type="text"
                placeholder="Morning consult"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </label>
          </div>
          <div className="schedule__form-actions">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save slot'}
            </Button>
          </div>
        </form>
      )}

      <div className="schedule__list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6d7489' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', marginBottom: 12 }} />
            Loading your slots...
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8f97ad', fontSize: 13, padding: '40px 0' }}>
            No slots yet. Click <strong>Add Slot</strong> to publish your first availability.
          </div>
        ) : (
          grouped.map(([date, daySlots]) => {
            const d = formatDate(date);
            return (
              <section key={date} className="schedule__day">
                <header className="schedule__day-head">
                  <span className="schedule__day-dot" aria-hidden="true" />
                  <span className="schedule__day-date">
                    {d.day} {d.month} {d.year}
                  </span>
                  <span className="schedule__day-weekday">{d.weekday}</span>
                  <span className="schedule__day-count">
                    ({daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'})
                  </span>
                </header>

                <div className="schedule__slots">
                  {daySlots.map((s) => (
                    <div key={s.id} className="schedule__slot">
                      <div className="schedule__slot-icon">
                        <Clock size={14} />
                      </div>
                      <div className="schedule__slot-body">
                        <div className="schedule__slot-time">
                          {formatTime(s.start_time)} – {formatTime(s.end_time)}
                        </div>
                        <div className="schedule__slot-label">{s.label}</div>
                      </div>
                      <button
                        type="button"
                        className="schedule__slot-remove"
                        onClick={() => removeSlot(s.id)}
                        aria-label="Remove slot"
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
