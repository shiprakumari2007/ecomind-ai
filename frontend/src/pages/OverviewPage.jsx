import React, { useState, useEffect } from 'react';
import {
  Zap,
  DollarSign,
  Leaf,
  AlertTriangle,
  Award,
  Clock,
  Building2,
  Cpu,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const PIE_COLORS = ['#10b981', '#0d9488', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function OverviewPage({ setActivePage }) {
  const { config, formatCurrency } = useApp();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeframe, setTimeframe] = useState('180');
  const [selectedDept, setSelectedDept] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getOverview({
        days: parseInt(timeframe, 10),
        department: selectedDept,
      });
      setData(res);
    } catch (err) {
      console.error('Error fetching overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe, selectedDept, config.record_count]);

  if (loading) {
    return <LoadingSpinner message="Aggregating facility energy metrics..." />;
  }

  const metrics = data?.metrics || {};
  const dailyTrend = data?.daily_trend || [];
  const deptDist = data?.department_distribution || [];
  const appDist = data?.appliance_distribution || [];

  return (
    <div className="space-y-6">
      {/* Filter and Quick Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Time Horizon:</span>
          {['30', '90', '180'].map((d) => (
            <button
              key={d}
              onClick={() => setTimeframe(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                timeframe === d
                  ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Departments</option>
            {deptDist.map((d) => (
              <option key={d.department} value={d.department}>
                {d.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Consumption"
          value={metrics.total_consumption_kwh ? metrics.total_consumption_kwh.toLocaleString() : '0'}
          unit="kWh"
          icon={Zap}
          change={metrics.previous_period_comparison}
          changeLabel="vs prior cycle"
          isNegativeGood={true}
          accentColor="emerald"
        />

        <MetricCard
          title="Estimated Energy Cost"
          value={formatCurrency(metrics.total_bill)}
          icon={DollarSign}
          change={metrics.previous_period_comparison}
          changeLabel="budget variance"
          isNegativeGood={true}
          accentColor="teal"
        />

        <MetricCard
          title="Carbon Emissions"
          value={metrics.total_co2_kg ? (metrics.total_co2_kg / 1000).toFixed(2) : '0'}
          unit="t CO2e"
          icon={Leaf}
          subtitle={`Factor: ${metrics.carbon_factor} kg CO2/kWh`}
          accentColor="blue"
        />

        <MetricCard
          title="Energy Wastage Rate"
          value={`${metrics.wastage_percentage || 0}%`}
          unit={`~${(metrics.wastage_kwh || 0).toLocaleString()} kWh`}
          icon={AlertTriangle}
          subtitle={`${metrics.active_anomalies_count || 0} active anomaly flags`}
          accentColor="amber"
        />
      </div>

      {/* Efficiency Score Banner & Secondary Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Efficiency Gauge Card */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sustainability Rating
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-emerald-400">
                {metrics.efficiency_score || 85}
              </span>
              <span className="text-slate-400 text-sm font-medium">/ 100 Score</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-300 transition-all duration-500"
                style={{ width: `${metrics.efficiency_score || 85}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Calculated from baseline adherence, off-hours curtailment, and detected anomaly density.
          </p>
        </div>

        {/* Peak Demand Hour */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Peak Operating Hour
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400">
                {String(metrics.peak_hour || 14).padStart(2, '0')}:00 hrs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Average peak load reaches <b>{metrics.peak_consumption_kwh || 0} kWh</b> concurrent draw.
            </p>
          </div>

          <button
            onClick={() => setActivePage('simulator')}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
          >
            Model Peak Load Shaving in Simulator
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Highest Consuming Department */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Primary Energy Consumer
            </span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Building2 className="w-5 h-5" />
            </span>
          </div>

          <div className="my-4">
            <div className="text-xl font-bold text-teal-300 truncate">
              {metrics.top_department || 'Data Center & IT'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Dominant Equipment: <b>{metrics.top_appliance || 'Server Precision Cooling'}</b>
            </p>
          </div>

          <button
            onClick={() => setActivePage('recommendations')}
            className="text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1 group"
          >
            View Tailored Optimization Plan
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* Main Consumption Trend Chart */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold tracking-tight">Facility Energy Consumption Timeline</h3>
            <p className="text-xs text-slate-400">Daily kWh monitored load vs 7-day rolling efficiency baseline</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Actual Load</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-300" />
              <span>Baseline Trend</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
              <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val.toLocaleString()} kWh`, 'Consumption']}
              />
              <Area
                type="monotone"
                dataKey="actual_kwh"
                name="Actual Load"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#energyGrad)"
              />
              <Area
                type="monotone"
                dataKey="baseline_kwh"
                name="Baseline Trend"
                stroke="#2dd4bf"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown & Appliance Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="text-base font-bold tracking-tight mb-1">Departmental Allocation</h3>
          <p className="text-xs text-slate-400 mb-4">Proportion of energy consumption and carbon by department</p>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptDist}
                  dataKey="consumption_kwh"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {deptDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val, name, item) => [
                    `${val.toLocaleString()} kWh (${item.payload.percentage}%)`,
                    item.payload.department,
                  ]}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-500/20 text-slate-400">
                <tr>
                  <th className="py-2">Department</th>
                  <th className="py-2 text-right">kWh</th>
                  <th className="py-2 text-right">Share</th>
                  <th className="py-2 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {deptDist.slice(0, 5).map((d) => (
                  <tr key={d.department} className="hover:bg-slate-800/20">
                    <td className="py-2 font-medium">{d.department}</td>
                    <td className="py-2 text-right">{d.consumption_kwh.toLocaleString()}</td>
                    <td className="py-2 text-right text-emerald-400">{d.percentage}%</td>
                    <td className="py-2 text-right">{formatCurrency(d.bill)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Appliance & Equipment Roster */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="text-base font-bold tracking-tight mb-1">Equipment Consumption Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Top energy loads ranked by cumulative power draw</p>

          <div className="space-y-4">
            {appDist.map((app) => (
              <div key={app.appliance} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-teal-400" />
                    <span className="font-medium">{app.appliance}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400">
                      {app.department}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400">
                    {app.consumption_kwh.toLocaleString()} kWh ({app.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                    style={{ width: `${Math.min(100, app.percentage * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-emerald-300">Run AI Sustainability Assistant</p>
                <p className="text-[11px] text-slate-400">Ask EcoBot why yesterday's consumption spiked</p>
              </div>
            </div>
            <button
              onClick={() => setActivePage('chatbot')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
            >
              Ask EcoBot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
