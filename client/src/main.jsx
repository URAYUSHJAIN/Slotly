import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AuthPage from './pages/AuthPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import HowItWorksPage from './pages/HowItWorksPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import AppointmentsPage from './pages/AppointmentsPage.jsx'
import PatientsPage from './pages/PatientsPage.jsx'
import BrowseDoctorsPage from './pages/BrowseDoctorsPage.jsx'
import { AuthProvider } from './lib/useAuth.jsx'

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/doctors" element={<BrowseDoctorsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
