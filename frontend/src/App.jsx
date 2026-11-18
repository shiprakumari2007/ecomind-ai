import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import OverviewPage from './pages/OverviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UploadPage from './pages/UploadPage';
import AnomaliesPage from './pages/AnomaliesPage';
import ForecastingPage from './pages/ForecastingPage';
import RecommendationsPage from './pages/RecommendationsPage';
import CarbonPage from './pages/CarbonPage';
import SimulatorPage from './pages/SimulatorPage';
import ChatbotPage from './pages/ChatbotPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function DashboardContent() {
  const { isDark } = useTheme();
  const [activePage, setActivePage] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0 transition-all duration-300">
        <Navbar activePage={activePage} setIsMobileOpen={setIsMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'overview' && <OverviewPage setActivePage={setActivePage} />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'upload' && <UploadPage />}
          {activePage === 'anomalies' && <AnomaliesPage />}
          {activePage === 'forecasting' && <ForecastingPage />}
          {activePage === 'recommendations' && <RecommendationsPage />}
          {activePage === 'carbon' && <CarbonPage />}
          {activePage === 'simulator' && <SimulatorPage />}
          {activePage === 'chatbot' && <ChatbotPage />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <DashboardContent />
      </AppProvider>
    </ThemeProvider>
  );
}
