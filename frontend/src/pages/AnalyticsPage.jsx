import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Layers,
  Thermometer,
  Users,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.getOverview({ days: 180 });
        setOverviewData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating diurnal patterns and multi-variate correlations..." />;
  }

  const hourlyPatterns = overviewData?.hourly_patterns || [];
  const dowPatterns = overviewData?.day_of_week_patterns || [];
  const deptDist = overviewData?.department_distribution || [];
  const appDist = overviewData?.appliance_distribution || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40">
        <h2 className="text-lg font-bold tracking-tight">Multi-Variate Energy Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore operational demand cycles, 24-hour diurnal baseload curves, day-of-week fluctuations,
          and thermal-occupancy interactions across monitored streams.
        </p>
      </div>

      {/* 24-Hour Diurnal Cycle Chart */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">24-Hour Diurnal Consumption Profile</h3>
              <p className="text-xs text-slate-400">
                Average, maximum spike, and minimum baseload per hour across all active meters
              </p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyPatterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
              <XAxis
                dataKey="hour"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(h) => `${String(h).padStart(2, '0')}:00`}
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val, name) => [`${val} kWh`, name]}
                labelFormatter={(h) => `Hour: ${String(h).padStart(2, '0')}:00 hrs`}
              />
              <Legend />
              <Bar dataKey="max_kwh" name="Peak Max Draw" fill="#f59e0b" opacity={0.3} radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="avg_kwh"
                name="Average Hourly Load"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="min_kwh"
                name="Minimum Night Baseload"
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-500/10 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span><b>Business Hours (08:00 - 18:00):</b> High concurrent HVAC & IT draw</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span><b>Peak Grid Window (11:00 - 15:00):</b> Coincident utility tariff peak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span><b>Overnight Baseload (00:00 - 05:00):</b> 24/7 Server racks and idle cooling</span>
          </div>
        </div>
      </div>

      {/* Day of the Week Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Day of Week Profile</h3>
              <p className="text-xs text-slate-400">Average energy draw by day showing weekday vs weekend drop</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowPatterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} kWh`, 'Avg Hourly Load']}
                />
                <Bar dataKey="avg_kwh" name="Avg Load (kWh)" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Load Intensity by Subsystem */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Subsystem Power Intensity</h3>
              <p className="text-xs text-slate-400">Proportional load allocation and operational sensitivity</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300">HVAC & Thermal Conditioning</span>
                <span className="font-mono text-emerald-400">~38.5% Load</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                High ambient temperature sensitivity (2.2 kW per °C above 20°C). Primary opportunity for setpoint optimization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-300">Data Center & Server Infrastructure</span>
                <span className="font-mono text-teal-400">~29.2% Load</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Continuous 24/7 non-fluctuating baseline. Cold-aisle containment and airflow optimization target.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-300">Industrial Machinery & Compressors</span>
                <span className="font-mono text-blue-400">~18.7% Load</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Intermittent high-draw duty cycles. Prone to pneumatic distribution leaks and sudden motor spikes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300">Lighting & Office Plug Loads</span>
                <span className="font-mono text-purple-400">~13.6% Load</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Strong weekday occupancy correlation (8:00 - 18:00). High off-hours vampire load reduction potential.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
