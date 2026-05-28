import { Navbar } from '../components/Navbar.jsx';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="u-container" style={{ padding: '60px 20px', flex: 1, maxWidth: 800 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#111522' }}>Terms of Service</h1>
        <p style={{ color: '#6d7489', lineHeight: 1.6, marginBottom: 16 }}>
          Last updated: October 2026
        </p>
        <p style={{ color: '#111522', lineHeight: 1.8, marginBottom: 20 }}>
          Welcome to Slotly. By accessing our website and using our booking services, you agree to comply with and be bound by the following terms and conditions.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>Use of the Platform</h2>
        <p style={{ color: '#111522', lineHeight: 1.8, marginBottom: 20 }}>
          Slotly provides a platform connecting patients with healthcare professionals. We are not a medical provider and do not provide medical advice. In an emergency, please contact your local emergency services immediately.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>Cancellations</h2>
        <p style={{ color: '#111522', lineHeight: 1.8, marginBottom: 20 }}>
          Appointments must be cancelled at least 24 hours in advance. Failure to do so may result in cancellation fees at the discretion of the healthcare provider.
        </p>
      </div>
    </div>
  );
}
