import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  Leaf,
  Zap,
  Sun,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function SimulatorPage() {
  const { isDark } = useTheme();
  const { formatCurrency, showNotification } = useApp();

  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    ac_temp_offset: 1.5,
    ac_operating_hours_reduction: 2.0,
    lighting_hours_reduction: 3.0,
    equipment_efficiency_boost_pct: 15.0,
    solar_offset_kwh_daily: 50.0,
  });

  const [simResult, setSimResult] = useState(null);

  const runSimulation = async (currentParams) => {
    try {
      setLoading(true);
      const res = await api.runSimulation(currentParams);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation calculation failed:', err);
      showNotification('Simulation calculation error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(params);
  }, [params]);

  const handleReset = () => {
    const defaults = {
      ac_temp_offset: 1.5,
      ac_operating_hours_reduction: 2.0,
      lighting_hours_reduction: 3.0,
      equipment_efficiency_boost_pct: 15.0,
      solar_offset_kwh_daily: 50.0,
    };
    setParams(defaults);
    showNotification('Simulator parameters reset to default recommendations.', 'success');
  };

  const breakdownData = simResult?.breakdown_by_initiative
    ? Object.entries(simResult.breakdown_by_initiative).map(([name, val]) => ({
        initiative: name,
        saved_kwh: val.saved_kwh,
        saved_bill: val.saved_bill,
        saved_co2: val.saved_co2,
      }))
    : [];

  const comparisonData = simResult
    ? [
        {
          metric: 'Monthly kWh',
          Baseline: simResult.baseline_monthly_kwh,
          Simulated: simResult.simulated_monthly_kwh,
        },
        {
          metric: 'Monthly Bill ($)',
          Baseline: simResult.baseline_monthly_bill,
          Simulated: simResult.simulated_monthly_bill,
        },
        {
          metric: 'Monthly CO2 (kg)',
          Baseline: simResult.baseline_monthly_co2_kg,
          Simulated: simResult.simulated_monthly_co2_kg,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Interactive What-If Energy Simulator</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Scenario Modeler
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate operational thermostat adjustments, lighting setbacks, equipment retrofits, and solar PV capacity.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          Reset Defaults
        </button>
      </div>

      {/* Sliders Input Panel & Results Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Control Panel */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } space-y-6`}
        >
          <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Operational Levers
          </h3>

          {/* Slider 1: AC Temp Offset */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">AC Thermostat Setpoint Rise</span>
              <span className="font-mono font-bold text-emerald-400">+{params.ac_temp_offset}°C</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={params.ac_temp_offset}
              onChange={(e) => setParams({ ...params, ac_temp_offset: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Every 1°C saves ~6.5% of chiller power</p>
          </div>

          {/* Slider 2: AC Hours Reduction */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">AC Operating Hours Curtailment</span>
              <span className="font-mono font-bold text-teal-400">-{params.ac_operating_hours_reduction} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={params.ac_operating_hours_reduction}
              onChange={(e) =>
                setParams({ ...params, ac_operating_hours_reduction: parseFloat(e.target.value) })
              }
              className="w-full accent-teal-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Night/weekend setback shutdown schedules</p>
          </div>

          {/* Slider 3: Lighting Hours Reduction */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Lighting Off-Hours Reduction</span>
              <span className="font-mono font-bold text-cyan-400">-{params.lighting_hours_reduction} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={params.lighting_hours_reduction}
              onChange={(e) =>
                setParams({ ...params, lighting_hours_reduction: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Smart occupancy sensor sweeps</p>
          </div>

          {/* Slider 4: Equipment Upgrade Boost */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Equipment Efficiency Upgrade</span>
              <span className="font-mono font-bold text-purple-400">+{params.equipment_efficiency_boost_pct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={params.equipment_efficiency_boost_pct}
              onChange={(e) =>
                setParams({ ...params, equipment_efficiency_boost_pct: parseFloat(e.target.value) })
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">VFDs, IE4 motors, and compressor leak repair</p>
          </div>

          {/* Slider 5: Solar Generation */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Rooftop Solar PV Generation</span>
              <span className="font-mono font-bold text-amber-400">+{params.solar_offset_kwh_daily} kWh/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="25"
              value={params.solar_offset_kwh_daily}
              onChange={(e) =>
                setParams({ ...params, solar_offset_kwh_daily: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">On-site clean distributed renewable energy</p>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Simulated Output Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Simulated Energy Reduction"
              value={`${simResult?.saved_kwh_percentage || 0}%`}
              unit={`-${(simResult?.saved_monthly_kwh || 0).toLocaleString()} kWh/mo`}
              icon={Zap}
              accentColor="emerald"
            />

            <MetricCard
              title="Monthly Bill Savings"
              value={formatCurrency(simResult?.saved_monthly_bill)}
              unit="/ month"
              icon={DollarSign}
              accentColor="teal"
            />

            <MetricCard
              title="Monthly CO2 Avoided"
              value={simResult?.saved_monthly_co2_kg ? (simResult.saved_monthly_co2_kg / 1000).toFixed(2) : '0'}
              unit="t CO2e / mo"
              icon={Leaf}
              accentColor="blue"
            />
          </div>

          {/* Annualized Impact Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600/15 via-teal-600/15 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Annualized Sustainability Return
              </span>
              <h3 className="text-2xl font-black text-slate-100 mt-1">
                {formatCurrency(simResult?.annualized_financial_savings)} / year Savings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total carbon abatement: <b>{(simResult?.annualized_co2_savings_kg || 0).toLocaleString()} kg CO2e/year</b>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-sm font-bold border border-emerald-500/30">
              ROI Factor: High Yield
            </div>
          </div>

          {/* Savings Breakdown by Initiative Bar Chart */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-base font-bold tracking-tight mb-1">Savings Contribution by Initiative</h3>
            <p className="text-xs text-slate-400 mb-4">Estimated kWh reduction per operational intervention</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                  <XAxis dataKey="initiative" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [`${val.toLocaleString()} kWh`, 'Energy Saved']}
                  />
                  <Bar dataKey="saved_kwh" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
