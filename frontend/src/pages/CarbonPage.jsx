import React, { useState, useEffect } from 'react';
import {
  Leaf,
  TreePine,
  Car,
  TrendingDown,
  Sliders,
  Building2,
  Calendar,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function CarbonPage() {
  const { isDark } = useTheme();
  const { config, showNotification } = useApp();

  const [loading, setLoading] = useState(true);
  const [carbonFactor, setCarbonFactor] = useState(0.72);
  const [data, setData] = useState(null);

  const fetchCarbon = async (overrideFactor = null) => {
    try {
      setLoading(true);
      const res = await api.getCarbonSummary(overrideFactor);
      setData(res);
      if (res.emission_factor_used) {
        setCarbonFactor(res.emission_factor_used);
      }
    } catch (err) {
      console.error('Failed to load carbon summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarbon();
  }, []);

  const handleApplyFactor = (newFactor) => {
    setCarbonFactor(newFactor);
    fetchCarbon(newFactor);
    showNotification(`Recalculated carbon emissions with factor: ${newFactor} kg CO2/kWh`, 'success');
  };

  if (loading && !data) {
    return <LoadingSpinner message="Calculating Scope 2 greenhouse gas emissions..." />;
  }

  const totalKg = data?.total_co2_kg || 0;
  const totalTons = (totalKg / 1000).toFixed(2);
  const treesNeeded = data?.equivalent_trees_needed || 0;
  const carMiles = data?.equivalent_cars_driven_miles || 0;
  const deptEmissions = data?.department_emissions || [];
  const trend = data?.trend || [];

  return (
    <div className="space-y-6">
      {/* Header and Factor Control */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Scope 2 Carbon Footprint Analyzer</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              GHG Protocol Scope 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantify greenhouse gas emissions from purchased electricity, calibrate regional grid factors, and track net-zero decarbonization trajectories.
          </p>
        </div>

        {/* Configurable Emission Factor Slider */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 text-xs w-full md:w-auto justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Grid Factor:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.2"
              max="1.2"
              step="0.02"
              value={carbonFactor}
              onChange={(e) => handleApplyFactor(parseFloat(e.target.value))}
              className="w-24 accent-emerald-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-emerald-400 w-16 text-right">
              {carbonFactor} kg/kWh
            </span>
          </div>
        </div>
      </div>

      {/* Primary Carbon KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Carbon Footprint"
          value={totalTons}
          unit="Metric Tons CO2e"
          icon={Leaf}
          subtitle={`Cumulative ${totalKg.toLocaleString()} kg CO2`}
          accentColor="emerald"
        />

        <MetricCard
          title="Monthly Carbon Output"
          value={data?.monthly_co2_kg ? (data.monthly_co2_kg / 1000).toFixed(2) : '0'}
          unit="t CO2e / month"
          icon={Calendar}
          subtitle={`Daily avg: ${(data?.daily_avg_co2_kg || 0).toLocaleString()} kg/day`}
          accentColor="teal"
        />

        <MetricCard
          title="Forest Sequestration Equivalent"
          value={treesNeeded.toLocaleString()}
          unit="Mature Trees"
          icon={TreePine}
          subtitle="Required for 1 year of offset"
          accentColor="blue"
        />

        <MetricCard
          title="Passenger Vehicle Miles"
          value={(carMiles / 1000).toFixed(1)}
          unit="k Miles Offset"
          icon={Car}
          subtitle="Typical ICE vehicle emissions"
          accentColor="amber"
        />
      </div>

      {/* Carbon Trend Chart vs Glidepath Target */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold tracking-tight">Monthly Carbon Trajectory vs Reduction Target</h3>
            <p className="text-xs text-slate-400">Monthly actual tCO2 emissions compared with a 15% efficiency reduction pathway</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Actual Scope 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-400 border-dashed" />
              <span>Target Glidepath (-15%)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val, name) => [`${(val / 1000).toFixed(2)} t CO2e`, name]}
              />
              <Area
                type="monotone"
                dataKey="co2_kg"
                name="Emissions (kg CO2)"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#carbonGrad)"
              />
              <Line
                type="monotone"
                dataKey="target_co2_kg"
                name="Target Pathway"
                stroke="#2dd4bf"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#2dd4bf' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Emissions Breakdown */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <h3 className="text-base font-bold tracking-tight mb-1">Departmental Carbon Footprint Allocation</h3>
        <p className="text-xs text-slate-400 mb-4">Direct Scope 2 carbon impact per operational division</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deptEmissions.map((dept) => (
            <div key={dept.department} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-200">{dept.department}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {dept.consumption_kwh.toLocaleString()} kWh ({dept.percentage}% of facility total)
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {(dept.co2_kg / 1000).toFixed(2)} t
                </span>
                <p className="text-[10px] text-slate-400">CO2 Equivalent</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
