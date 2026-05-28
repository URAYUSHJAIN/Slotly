import { Navbar } from '../components/Navbar.jsx';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="u-container" style={{ padding: '60px 20px', flex: 1, maxWidth: 800 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#111522' }}>Privacy Policy</h1>
        <p style={{ color: '#6d7489', lineHeight: 1.6, marginBottom: 16 }}>
          Last updated: October 2026
        </p>
        <p style={{ color: '#111522', lineHeight: 1.8, marginBottom: 20 }}>
          At Slotly, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>Information We Collect</h2>
        <p style={{ color: '#111522', lineHeight: 1.8, marginBottom: 20 }}>
          We collect personal information that you provide to us when you register for an account, express an interest in obtaining information about us or our products, or otherwise contact us.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>HIPAA Compliance</h2>
        <p style={{ color: '#111522', lineHeight: 1.8, marginBottom: 20 }}>
          All medical and booking data is encrypted at rest and in transit. We fully comply with the Health Insurance Portability and Accountability Act (HIPAA) to ensure patient data remains strictly confidential.
        </p>
      </div>
    </div>
  );
}
