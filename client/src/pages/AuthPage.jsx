import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authClient, fetchMyProfile } from '../lib/neonApi.js';
import { createProfile, createDoctorDetails } from '../lib/neonApi.js';
import { useAuth } from '../lib/useAuth.jsx';
import logo from '../assets/logo.webp';
import clinicModern from '../assets/clinic-modern.jpg';

export default function AuthPage() {
  const navigate = useNavigate();
  const { status, refresh } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [formData, setFormData] = useState({
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
  });
  const [role, setRole] = useState('patient'); // 'patient' | 'doctor'
  const [formStatus, setFormStatus] = useState({ state: 'idle', message: '' });

  if (status === 'loading') return null;
  if (status === 'authed') return <Navigate to="/appointments" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup' && !formData.acceptedTerms) {
      setFormStatus({ state: 'error', message: 'You must accept the Terms and Conditions.' });
      return;
    }

    setFormStatus({ state: 'loading', message: 'Please wait…' });

    try {
      if (mode === 'signup') {
        const { data, error } = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
        });
        if (error) throw new Error(error.message || 'Signup failed.');

        const userId = data?.user?.id;
        if (!userId) throw new Error('User ID missing after signup.');

        // Insert into our profiles table
        await createProfile({
          userId,
          role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobile: formData.mobile,
          gender: formData.gender,
          dateOfBirth: formData.dob || null,
        });

        if (role === 'doctor') {
          await createDoctorDetails({
            userId,
            qualification: formData.qualification,
            experience: formData.experience,
            speciality: formData.speciality,
            appointmentPrice: formData.appointmentPrice,
          });
        }

        await refresh();
        setFormStatus({ state: 'success', message: 'Account created. Redirecting…' });
        setTimeout(() => navigate('/appointments'), 600);
      } else {
        const { error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw new Error(error.message || 'Login failed.');

        // Verify the role matches what they selected
        const profile = await fetchMyProfile();
        if (!profile || profile.role !== role) {
          await authClient.signOut();
          throw new Error(`This account is not a registered ${role === 'doctor' ? 'Doctor' : 'Patient'}. Please use the correct login tab or sign up.`);
        }

        await refresh();
        setFormStatus({ state: 'success', message: 'Signed in successfully. Redirecting…' });
        setTimeout(() => navigate('/appointments'), 600);
      }
    } catch (err) {
      setFormStatus({ state: 'error', message: err.message });
    }
  };

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
          <form className="auth-form" onSubmit={handleSubmit}>
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
              <>
                <div className="auth-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <label className="auth-field">
                    Email (required)
                    <input
                      type="email"
                      required
                      placeholder="Enter Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </label>
                  <label className="auth-field">
                    Password (required)
                    <input
                      type="password"
                      required
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="auth-grid">
                  <label className="auth-field">
                    First Name (required)
                    <input
                      type="text"
                      required
                      placeholder="Enter First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </label>
                  <label className="auth-field">
                    Last Name
                    <input
                      type="text"
                      placeholder="Enter Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
                  </label>

                  <label className="auth-field auth-field--full">
                    Email (required)
                    <input
                      type="email"
                      required
                      placeholder="Enter Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </label>

                  <label className="auth-field">
                    Gender
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
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
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </label>

                  <label className="auth-field auth-field--full">
                    Password (required)
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                          value={formData.speciality}
                          onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                        />
                      </label>
                      <label className="auth-field">
                        Qualification (required)
                        <input
                          type="text"
                          required
                          placeholder="e.g. MBBS, MD"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        />
                      </label>
                      <label className="auth-field">
                        Experience (required)
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10 Years"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
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
                            value={formData.appointmentPrice}
                            onChange={(e) => setFormData({ ...formData, appointmentPrice: e.target.value })}
                          />
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </>
            )}

            <label className="auth-checkbox" style={{ marginTop: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={formData.acceptedTerms}
                onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
              />
              I accept the Terms and Conditions
            </label>

            {formStatus.message && (
              <div className={`auth-status auth-status--${formStatus.state}`}>
                {formStatus.message}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={formStatus.state === 'loading'}>
              {mode === 'login'
                ? (role === 'doctor' ? 'Doctor Login' : 'Patient Login')
                : 'Signup / Continue'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              {mode === 'login' ? (
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => {
                    setMode('signup');
                    setFormStatus({ state: 'idle', message: '' });
                  }}
                >
                  Don't have an Account? Signup
                </button>
              ) : (
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => {
                    setMode('login');
                    setFormStatus({ state: 'idle', message: '' });
                  }}
                >
                  Already have an Account? Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
