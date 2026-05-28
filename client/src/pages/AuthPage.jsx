/**
 * AuthPage — Login / Signup screen.
 *
 * Two sub-forms (LoginForm + SignupForm) so each owns its own state and
 * the mode switch fully resets fields. Both call into authActions.js,
 * which is the single source of truth for auth mutations.
 */
import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { signUp, signIn } from '../lib/authActions.js';
import { useAuth } from '../lib/useAuth.jsx';
import logo from '../assets/logo.webp';
import clinicModern from '../assets/clinic-modern.jpg';

export default function AuthPage() {
  const { status } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('patient'); // 'patient' | 'doctor'

  if (status === 'loading') return null;
  if (status === 'authed') return <Navigate to="/appointments" replace />;

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="Slotly" />
          <span>Slotly</span>
        </Link>
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Back to home
        </Link>
      </header>

      <div className="auth-shell">
        <div className="auth-visual">
          <img src={clinicModern} alt="Modern Clinic" />
          <div className="auth-visual-overlay"></div>
          <div className="auth-visual-content">
            <span className="auth-visual-kicker">Welcome to Slotly</span>
            <h1>Book care, instantly.</h1>
            <p>Join thousands of patients experiencing the future of healthcare scheduling.</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-role-tabs">
            <button
              type="button"
              className={role === 'patient' ? 'is-active' : ''}
              onClick={() => setRole('patient')}
            >
              Patient {mode === 'login' ? 'Login' : 'Signup'}
            </button>
            <button
              type="button"
              className={role === 'doctor' ? 'is-active' : ''}
              onClick={() => setRole('doctor')}
            >
              Doctor {mode === 'login' ? 'Login' : 'Signup'}
            </button>
          </div>

          {mode === 'login' ? (
            <LoginForm role={role} onSwitchMode={() => setMode('signup')} />
          ) : (
            <SignupForm role={role} onSwitchMode={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* LoginForm                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function LoginForm({ role, onSwitchMode }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formStatus, setFormStatus] = useState({ state: 'idle', message: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ state: 'loading', message: 'Signing in…' });
    try {
      await signIn({ email, password, expectedRole: role });
      await refresh();
      setFormStatus({ state: 'success', message: 'Signed in. Redirecting…' });
      setTimeout(() => navigate('/appointments'), 500);
    } catch (err) {
      setFormStatus({ state: 'error', message: err.message });
    }
  };

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-grid" style={{ gridTemplateColumns: '1fr' }}>
        <label className="auth-field">
          Email (required)
          <input
            type="email"
            required
            placeholder="Enter Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="auth-field">
          Password (required)
          <input
            type="password"
            required
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>

      {formStatus.message && (
        <div className={`auth-status auth-status--${formStatus.state}`}>
          {formStatus.message}
        </div>
      )}

      <button type="submit" className="auth-submit" disabled={formStatus.state === 'loading'}>
        {role === 'doctor' ? 'Doctor Login' : 'Patient Login'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button type="button" className="auth-switch" onClick={onSwitchMode}>
          Don't have an Account? Signup
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* SignupForm                                                           */
/* ─────────────────────────────────────────────────────────────────── */

const EMPTY_SIGNUP = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  password: '',
  gender: '',
  dob: '',
  qualification: '',
  experience: '',
  speciality: '',
  appointmentPrice: '',
  acceptedTerms: false,
};

function SignupForm({ role, onSwitchMode }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState(EMPTY_SIGNUP);
  const [formStatus, setFormStatus] = useState({ state: 'idle', message: '' });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.acceptedTerms) {
      setFormStatus({ state: 'error', message: 'You must accept the Terms and Conditions.' });
      return;
    }
    if (form.password.length < 8) {
      setFormStatus({ state: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }

    setFormStatus({ state: 'loading', message: 'Creating your account…' });

    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        gender: form.gender,
        dob: form.dob,
        role,
        doctorDetails: role === 'doctor' ? {
          qualification: form.qualification.trim(),
          experience: form.experience.trim(),
          speciality: form.speciality.trim(),
          appointmentPrice: form.appointmentPrice,
        } : null,
      });

      await refresh();
      setFormStatus({ state: 'success', message: 'Account created. Redirecting…' });
      setTimeout(() => navigate('/appointments'), 600);
    } catch (err) {
      setFormStatus({ state: 'error', message: err.message });
    }
  };

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-grid">
        <label className="auth-field">
          First Name (required)
          <input
            type="text"
            required
            placeholder="Enter First Name"
            value={form.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
          />
        </label>
        <label className="auth-field">
          Last Name
          <input
            type="text"
            placeholder="Enter Last Name"
            value={form.lastName}
            onChange={(e) => set({ lastName: e.target.value })}
          />
        </label>

        <label className="auth-field auth-field--full">
          Mobile No. (required)
          <div className="auth-input-group">
            <span>IN +91</span>
            <input
              type="tel"
              required
              placeholder="Enter your mobile number"
              value={form.mobile}
              onChange={(e) => set({ mobile: e.target.value })}
            />
          </div>
        </label>

        <label className="auth-field auth-field--full">
          Email (required)
          <input
            type="email"
            required
            placeholder="Enter Email Address"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </label>

        <label className="auth-field">
          Gender
          <select value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="auth-field">
          Date of Birth
          <input
            type="date"
            value={form.dob}
            onChange={(e) => set({ dob: e.target.value })}
          />
        </label>

        <label className="auth-field auth-field--full">
          Password (required, min 8 chars)
          <input
            type="password"
            required
            minLength={8}
            placeholder="Enter Password"
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
          />
        </label>

        {role === 'doctor' && (
          <>
            <label className="auth-field">
              Speciality (required)
              <input
                type="text"
                required
                placeholder="e.g. Cardiologist"
                value={form.speciality}
                onChange={(e) => set({ speciality: e.target.value })}
              />
            </label>
            <label className="auth-field">
              Qualification (required)
              <input
                type="text"
                required
                placeholder="e.g. MBBS, MD"
                value={form.qualification}
                onChange={(e) => set({ qualification: e.target.value })}
              />
            </label>
            <label className="auth-field">
              Experience (required)
              <input
                type="text"
                required
                placeholder="e.g. 10 Years"
                value={form.experience}
                onChange={(e) => set({ experience: e.target.value })}
              />
            </label>
            <label className="auth-field">
              Appointment Price (required)
              <div className="auth-input-group">
                <span>₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 500"
                  value={form.appointmentPrice}
                  onChange={(e) => set({ appointmentPrice: e.target.value })}
                />
              </div>
            </label>
          </>
        )}
      </div>

      <label className="auth-checkbox" style={{ marginTop: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={form.acceptedTerms}
          onChange={(e) => set({ acceptedTerms: e.target.checked })}
        />
        I accept the Terms and Conditions
      </label>

      {formStatus.message && (
        <div className={`auth-status auth-status--${formStatus.state}`}>
          {formStatus.message}
        </div>
      )}

      <button type="submit" className="auth-submit" disabled={formStatus.state === 'loading'}>
        Signup / Continue
      </button>

      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button type="button" className="auth-switch" onClick={onSwitchMode}>
          Already have an Account? Login
        </button>
      </div>
    </form>
  );
}
