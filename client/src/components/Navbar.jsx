/**
 * Navbar — fully role-specific link sets.
 *
 *   anon     → marketing links (Features / How it works / Pricing / About) + Sign in
 *   patient  → app links (Find Care / Appointments)                         + user pill
 *   doctor   → app links (My Schedule / Patients)                           + user pill
 *
 * The link set is picked from the auth context — there is no overlap between
 * the marketing nav and the in-app nav.
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import logo from '../assets/logo.webp';
import { useAuth } from '../lib/useAuth.jsx';

const PUBLIC_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
];

const PATIENT_LINKS = [
  { label: 'Find Care', to: '/' },
  { label: 'Browse Doctors', to: '/doctors' },
  { label: 'Appointments', to: '/appointments' },
];

const DOCTOR_LINKS = [
  { label: 'My Schedule', to: '/appointments' },
  { label: 'Patients', to: '/patients' },
];

function pickLinks(status, role) {
  if (status !== 'authed') return PUBLIC_LINKS;
  if (role === 'doctor') return DOCTOR_LINKS;
  return PATIENT_LINKS;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status, user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.navbar__user-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isAuthed = status === 'authed';
  const links = pickLinks(status, role);

  const displayName =
    profile?.first_name ||
    user?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Account';

  const initials = (
    (profile?.first_name?.[0] || user?.name?.[0] || user?.email?.[0] || '?')
  ).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="Slotly">
          <img className="navbar__logo-image" src={logo} alt="Slotly" />
          <span className="navbar__logo-text">Slotly</span>
        </Link>

        {/* Desktop nav — role-specific */}
        <nav aria-label="Main navigation" className="navbar__desktop-nav">
          <ul className="navbar__nav">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  end={link.to === '/'}
                  to={link.to}
                  className={({ isActive }) =>
                    ['navbar__link', isActive ? 'navbar__link--active' : '']
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side */}
        <div className="navbar__actions">
          {!isAuthed && (
            <Link to="/auth" className="btn btn--ghost btn--sm navbar__signin-desktop">
              Sign in
            </Link>
          )}

          {isAuthed && (
            <div className="navbar__user-container" style={{ position: 'relative' }}>
              <button
                type="button"
                className="navbar__user"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, outline: 'none' }}
              >
                <span className="navbar__avatar" aria-hidden="true">{initials}</span>
                <div className="navbar__user-meta" style={{ textAlign: 'left' }}>
                  <span className="navbar__user-name">{displayName}</span>
                  <span className="navbar__user-role">
                    {role === 'doctor' ? 'Doctor' : role === 'patient' ? 'Patient' : '...'}
                  </span>
                </div>
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown animate-fade-in-up">
                  <div className="navbar-dropdown__header">
                    <div className="navbar-dropdown__name">{profile?.first_name} {profile?.last_name || ''}</div>
                    <div className="navbar-dropdown__email">{user?.email}</div>
                  </div>
                  <div className="navbar-dropdown__body">
                    {profile?.mobile && (
                      <div className="navbar-dropdown__item">
                        <span className="navbar-dropdown__label">Mobile</span>
                        <span className="navbar-dropdown__value">{profile.mobile}</span>
                      </div>
                    )}
                    {profile?.gender && (
                      <div className="navbar-dropdown__item">
                        <span className="navbar-dropdown__label">Gender</span>
                        <span className="navbar-dropdown__value">{profile.gender}</span>
                      </div>
                    )}
                  </div>
                  <div className="navbar-dropdown__footer">
                    <button type="button" onClick={handleSignOut} className="navbar-dropdown__signout">
                      <LogOut size={14} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            type="button" 
            className="navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu">
          <nav aria-label="Mobile navigation">
            <ul className="navbar__mobile-nav">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    end={link.to === '/'}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      ['navbar__mobile-link', isActive ? 'navbar__mobile-link--active' : '']
                        .filter(Boolean)
                        .join(' ')
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              
              {!isAuthed && (
                <li style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9ecf5' }}>
                  <Link 
                    to="/auth" 
                    className="navbar__mobile-link"
                    style={{ color: '#4f6df5' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
