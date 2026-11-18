import React from 'react';
import { Menu, Sun, Moon, RotateCw, Database, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { navItems } from './Sidebar';

export default function Navbar({ activePage, setIsMobileOpen }) {
  const { isDark, toggleTheme } = useTheme();
  const { config, refreshData, loadingConfig, notification } = useApp();

  const currentNav = navItems.find((n) => n.id === activePage) || navItems[0];

  return (
    <header
      className={`sticky top-0 z-30 px-6 py-4 border-b backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-slate-950/70 border-slate-800/80 text-white'
          : 'bg-white/80 border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu Trigger + Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{currentNav.label}</h1>
              {currentNav.isAi && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                  AI Powered
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {activePage === 'overview' && 'Executive energy performance scorecard & diurnal telemetry'}
              {activePage === 'analytics' && 'Detailed appliance & department-level multi-variate telemetry'}
              {activePage === 'upload' && 'Upload CSV/Excel energy files or inspect data quality score'}
              {activePage === 'anomalies' && 'Isolation Forest unsupervised anomaly detection & diagnosis'}
              {activePage === 'forecasting' && '7-day & 30-day predictive demand regression with 95% confidence bands'}
              {activePage === 'recommendations' && 'Prioritized sustainability initiatives with quantified ROI'}
              {activePage === 'carbon' && 'Scope 2 greenhouse gas emissions & decarbonization glidepath'}
              {activePage === 'simulator' && 'Interactive scenario modeling for HVAC, lighting & solar PV'}
              {activePage === 'chatbot' && 'Context-grounded conversational energy & decarbonization assistant'}
              {activePage === 'reports' && 'Export executive audit summaries in professional PDF format'}
              {activePage === 'settings' && 'Configure tariffs, emission factors, and AI credentials'}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Dataset Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
              config.record_count > 0
                ? isDark
                  ? 'bg-slate-900/80 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {config.record_count > 0
                ? `${config.record_count.toLocaleString()} Records Active`
                : 'No Dataset Loaded'}
            </span>
          </div>

          {/* Sync / Refresh */}
          <button
            onClick={refreshData}
            title="Refresh Data"
            disabled={loadingConfig}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${loadingConfig ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-amber-400'
                : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div
          className={`mt-3 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between border animate-fade-in ${
            notification.type === 'error'
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}
    </header>
  );
}
