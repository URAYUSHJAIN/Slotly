/**
 * AppointmentsPage — gateway that picks the view based on role.
 *   patient → <PatientAppointments />  (My Appointments, with Upcoming/Previous/Today)
 *   doctor  → Doctor Layout with tabs for <DoctorDashboard /> and <DoctorSchedule />
 */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth.jsx';
import { Navbar } from '../components/Navbar.jsx';
import PatientAppointments from './appointments/PatientAppointments.jsx';
import DoctorSchedule from './appointments/DoctorSchedule.jsx';
import DoctorDashboard from './appointments/DoctorDashboard.jsx';

function DoctorView() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'schedule'

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecf5', padding: '0 20px' }}>
        <div className="u-container" style={{ display: 'flex', gap: 24 }}>
          <button
            onClick={() => setView('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: view === 'dashboard' ? '2px solid #4f6df5' : '2px solid transparent',
              color: view === 'dashboard' ? '#111522' : '#6d7489',
              fontWeight: view === 'dashboard' ? 600 : 500,
              padding: '16px 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('schedule')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: view === 'schedule' ? '2px solid #4f6df5' : '2px solid transparent',
              color: view === 'schedule' ? '#111522' : '#6d7489',
              fontWeight: view === 'schedule' ? 600 : 500,
              padding: '16px 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            Manage Availability
          </button>
        </div>
      </div>
      
      {view === 'dashboard' ? <DoctorDashboard /> : <DoctorSchedule />}
    </>
  );
}

export default function AppointmentsPage() {
  const { status, role, profile } = useAuth();
  
  console.log('AppointmentsPage render:', { status, role, profile });

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

  if (status === 'anon') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc' }}>
      <div className="page-content">
        <Navbar />
        {role === 'doctor' ? <DoctorView /> : <PatientAppointments />}
      </div>
    </div>
  );
}
