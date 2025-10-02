import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InterestSelectionPage from './pages/InterestSelectionPage';
import PersonalizationTuningPage from './pages/PersonalizationTuningPage';
import FrequencySettingsPage from './pages/FrequencySettingsPage';
import DashboardPage from './pages/DashboardPage';
import { usePreferences } from './contexts/PreferencesContext';
import { PagePath } from './constants';

const App: React.FC = () => {
  const { user } = usePreferences();
  const isAuthenticated = user.email !== "" && user.whatsappNumber !== "";
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        <Route path={PagePath.LANDING} element={<LandingPage />} />
        <Route
          path={PagePath.INTERESTS}
          element={isAuthenticated ? <InterestSelectionPage /> : <Navigate to={PagePath.LANDING} />}
        />
        <Route
          path={PagePath.TUNING}
          element={isAuthenticated ? <PersonalizationTuningPage /> : <Navigate to={PagePath.LANDING} />}
        />
        <Route
          path={PagePath.FREQUENCY}
          element={isAuthenticated ? <FrequencySettingsPage /> : <Navigate to={PagePath.LANDING} />}
        />
        <Route
          path={PagePath.DASHBOARD}
          element={isAuthenticated ? <DashboardPage /> : <Navigate to={PagePath.LANDING} />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? PagePath.DASHBOARD : PagePath.LANDING} />}
        />
      </Routes>
    </div>
  );
};

export default App;