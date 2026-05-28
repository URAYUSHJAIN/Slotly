import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export default function SupportPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="u-container" style={{ padding: '60px 20px', flex: 1, maxWidth: 800 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#111522' }}>Support & Help Center</h1>
        <p style={{ color: '#6d7489', lineHeight: 1.6, marginBottom: 32 }}>
          We're here to help! Whether you're a patient needing help booking an appointment, or a doctor with a scheduling question, our team is ready to assist you.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e9ecf5', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eef2ff', color: '#4f6df5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111522', marginBottom: 4 }}>Email Support</h3>
              <p style={{ color: '#6d7489', fontSize: 14 }}>urayushjain@gmail.com</p>
            </div>
          </div>

          <div style={{ padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e9ecf5', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eef2ff', color: '#4f6df5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111522', marginBottom: 4 }}>Phone Support</h3>
              <p style={{ color: '#6d7489', fontSize: 14 }}>+1 (800) 123-4567</p>
            </div>
          </div>

          <div style={{ padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e9ecf5', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eef2ff', color: '#4f6df5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111522', marginBottom: 4 }}>Live Chat</h3>
              <p style={{ color: '#6d7489', fontSize: 14 }}>Available Mon-Fri, 9am - 5pm EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
