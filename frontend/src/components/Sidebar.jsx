import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  UploadCloud,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Leaf,
  Sliders,
  Bot,
  FileText,
  Settings,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Energy Analytics', icon: LineChart },
  { id: 'upload', label: 'Upload Dataset', icon: UploadCloud },
  { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badgeKey: 'anomalies' },
  { id: 'forecasting', label: 'Energy Forecasting', icon: TrendingUp },
  { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, badgeKey: 'recommendations' },
  { id: 'carbon', label: 'Carbon Footprint', icon: Leaf },
  { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
  { id: 'chatbot', label: 'EcoBot AI Assistant', icon: Bot, isAi: true },
  { id: 'reports', label: 'Sustainability Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen }) {
  const { isDark } = useTheme();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark
            ? 'bg-slate-900/90 border-r border-slate-800 text-slate-200'
            : 'bg-white/90 border-r border-slate-200 text-slate-700'
        } backdrop-blur-xl flex flex-col`}
      >
        {/* Brand / Logo Header */}
        <div className="p-6 border-b border-emerald-500/10 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className={`w-full h-full rounded-[10px] ${isDark ? 'bg-slate-950' : 'bg-white'} flex items-center justify-center`}>
              <div className="relative">
                <Leaf className="w-5 h-5 text-emerald-500" />
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400 absolute -bottom-0.5 -right-0.5" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                EcoMind
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Energy & Sustainability</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-300 border border-emerald-500/30 shadow-xs shadow-emerald-500/10'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : isDark
                    ? 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-emerald-600 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 group-hover:text-emerald-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.isAi && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/50'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </span>
            <span className="font-mono text-[11px] text-slate-400">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
