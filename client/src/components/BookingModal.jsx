/**
 * BookingModal — overlay modal for patients to book an appointment with a doctor.
 *
 * Props:
 *   doctor   – { id, firstName, lastName, speciality, qualification, experience, appointmentPrice }
 *   onClose  – () => void   (dismiss the modal)
 *   onBook   – (booking) => void   (confirm booking callback)
 */
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle, User, Stethoscope, IndianRupee, Loader2 } from 'lucide-react';
import { createAppointment, fetchDoctorAvailabilityForDate, fetchDoctorAppointmentsForDate } from '../lib/neonApi.js';
import { useAuth } from '../lib/useAuth.jsx';

function generateSlots(startTime, endTime, bookedStartTimes) {
  const slots = [];
  let [h, m] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const endTotalMins = endH * 60 + endM;
  
  while (true) {
    const currentTotalMins = h * 60 + m;
    if (currentTotalMins + 30 > endTotalMins) break; // Not enough time for a 30min slot
    
    const startStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    // next 30 mins
    let nextM = m + 30;
    let nextH = h;
    if (nextM >= 60) {
      nextM -= 60;
      nextH += 1;
    }
    const endStr = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
    
    // Formatting label (e.g. 9:00 AM)
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    const label = `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    
    if (!bookedStartTimes.has(startStr)) {
      slots.push({ start: startStr, end: endStr, label });
    }
    
    h = nextH;
    m = nextM;
  }
  return slots;
}

export default function BookingModal({ doctor, onClose, onBook }) {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | confirming | done
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');

  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
  const initials = (doctor.firstName?.[0] || '?').toUpperCase();

  // When date changes, fetch availability and appointments
  useEffect(() => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    async function loadAvailability() {
      setLoadingSlots(true);
      setSlotError('');
      setSelectedSlot(null);
      
      try {
        // If it's a seed doctor, just use a dummy schedule to avoid breaking demo
        if (String(doctor.id).startsWith('seed-')) {
           const dummySlots = generateSlots('09:00', '17:00', new Set());
           setAvailableSlots(dummySlots);
           setLoadingSlots(false);
           return;
        }

        const [availRecords, apptRecords] = await Promise.all([
          fetchDoctorAvailabilityForDate(doctor.id, date),
          fetchDoctorAppointmentsForDate(doctor.id, date)
        ]);

        const bookedStartTimes = new Set((apptRecords || []).map(a => a.start_time));
        
        let allSlots = [];
        for (const block of (availRecords || [])) {
          const generated = generateSlots(block.start_time, block.end_time, bookedStartTimes);
          allSlots = [...allSlots, ...generated];
        }

        // Sort just in case blocks were out of order
        allSlots.sort((a, b) => a.start.localeCompare(b.start));
        
        setAvailableSlots(allSlots);
      } catch (err) {
        console.error("Failed to load availability", err);
        setSlotError('Could not load availability for this date.');
      } finally {
        setLoadingSlots(false);
      }
    }

    loadAvailability();
  }, [date, doctor.id]);


  const handleConfirm = async () => {
    if (!date || selectedSlot === null) return;
    setStatus('confirming');
    const slot = availableSlots[selectedSlot];

    try {
      if (String(doctor.id).startsWith('seed-')) {
        setStatus('done');
        setTimeout(() => {
          alert("Note: You booked a sample doctor. This won't be saved to the database. To test real bookings, please sign up as a doctor and book your real profile!");
          onBook({
            doctorId: doctor.id,
            doctorName: fullName,
            speciality: doctor.speciality,
            date,
            start: slot.start,
            end: slot.end,
            price: doctor.appointmentPrice,
          });
        }, 800);
        return;
      }

      await createAppointment({
        patientId: user.id, 
        doctorId: doctor.id,
        appointmentDate: date,
        startTime: slot.start,
        endTime: slot.end,
        fee: doctor.appointmentPrice,
      });
      
      setStatus('done');
      setTimeout(() => {
        onBook({
          doctorId: doctor.id,
          doctorName: fullName,
          speciality: doctor.speciality,
          date,
          start: slot.start,
          end: slot.end,
          price: doctor.appointmentPrice,
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to book appointment:', error);
      setStatus('idle');
      
      if (error.message.includes('relation "public.appointments" does not exist')) {
        alert('Failed: The appointments table is missing! Please run the schema.sql code in your Neon dashboard.');
      } else {
        alert('Failed to book appointment. Please try again.');
      }
    }
  };

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div className="booking-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          className="booking-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Doctor info header */}
        <div className="booking-modal__doctor">
          <div className="booking-modal__avatar">{initials}</div>
          <div className="booking-modal__doctor-info">
            <div className="booking-modal__doctor-name">Dr. {fullName}</div>
            <div className="booking-modal__doctor-spec">
              <Stethoscope size={12} />
              {doctor.speciality}
            </div>
          </div>
          <div className="booking-modal__price">
            <IndianRupee size={13} />
            {Number(doctor.appointmentPrice).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Doctor details strip */}
        <div className="booking-modal__details">
          <div className="booking-modal__detail">
            <span className="booking-modal__detail-label">Qualification</span>
            <span className="booking-modal__detail-value">{doctor.qualification || '—'}</span>
          </div>
          <div className="booking-modal__detail">
            <span className="booking-modal__detail-label">Experience</span>
            <span className="booking-modal__detail-value">{doctor.experience || '—'}</span>
          </div>
        </div>

        {status === 'done' ? (
          <div className="booking-modal__success">
            <div className="booking-modal__success-icon">
              <CheckCircle size={32} />
            </div>
            <div className="booking-modal__success-title">Booking Requested!</div>
            <div className="booking-modal__success-sub">
              Awaiting doctor confirmation. You'll see it in your appointments shortly.
            </div>
          </div>
        ) : (
          <>
            {/* Date picker */}
            <label className="booking-modal__field">
              <span className="booking-modal__field-label">
                <Calendar size={13} /> Select Date
              </span>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="booking-modal__date-input"
              />
            </label>

            {/* Time slots */}
            {date && (
              <div className="booking-modal__slots-section">
                <span className="booking-modal__field-label">
                  <Clock size={13} /> Available Time Slots
                </span>
                
                {loadingSlots ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6d7489' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto', marginBottom: '8px' }}/>
                    Checking availability...
                  </div>
                ) : slotError ? (
                  <div style={{ color: '#c93a3a', fontSize: '13px', marginTop: '8px' }}>{slotError}</div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ color: '#6d7489', fontSize: '13px', marginTop: '8px', fontStyle: 'italic' }}>
                    No slots available for this date.
                  </div>
                ) : (
                  <div className="booking-modal__slots-grid">
                    {availableSlots.map((slot, i) => (
                      <button
                        key={slot.start}
                        type="button"
                        className={`booking-modal__slot ${selectedSlot === i ? 'is-selected' : ''}`}
                        onClick={() => setSelectedSlot(i)}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary + Confirm */}
            {date && selectedSlot !== null && availableSlots[selectedSlot] && (
              <div className="booking-modal__summary">
                <div className="booking-modal__summary-row">
                  <span>Doctor</span>
                  <strong>Dr. {fullName}</strong>
                </div>
                <div className="booking-modal__summary-row">
                  <span>Date</span>
                  <strong>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className="booking-modal__summary-row">
                  <span>Time</span>
                  <strong>{availableSlots[selectedSlot].label}</strong>
                </div>
                <div className="booking-modal__summary-row">
                  <span>Fee</span>
                  <strong>₹{Number(doctor.appointmentPrice).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className="booking-modal__confirm"
              disabled={!date || selectedSlot === null || status === 'confirming'}
              onClick={handleConfirm}
            >
              {status === 'confirming' ? 'Requesting…' : 'Request Appointment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
