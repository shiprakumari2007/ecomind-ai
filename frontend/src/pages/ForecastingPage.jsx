import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Zap,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
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
  Legend,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function ForecastingPage() {
  const { isDark } = useTheme();
  const { formatCurrency } = useApp();

  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(7);
  const [modelType, setModelType] = useState('GradientBoosting');
  const [forecastData, setForecastData] = useState(null);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getForecast(horizon, modelType);
      setForecastData(res);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [horizon, modelType]);

  if (loading && !forecastData) {
    return <LoadingSpinner message="Training time-series model & computing confidence bounds..." />;
  }

  const points = forecastData?.points || [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Machine Learning Energy Forecasting</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {forecastData?.model_name || 'GradientBoosting-TimeSeries'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-step recursive time-series regression with day-of-week, lag factors, and residual-based 95% confidence intervals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Horizon:</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value, 10))}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-hidden"
            >
              <option value="7">7 Days Ahead</option>
              <option value="10">10 Days Ahead</option>
              <option value="14">14 Days Ahead</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Model:</span>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="bg-transparent text-teal-400 font-semibold focus:outline-hidden"
            >
              <option value="GradientBoosting">Gradient Boosting</option>
              <option value="RandomForest">Random Forest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projection Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Next 7 Days Projected"
          value={forecastData?.next_7_days_kwh ? forecastData.next_7_days_kwh.toLocaleString() : '0'}
          unit="kWh"
          icon={TrendingUp}
          accentColor="emerald"
        />

        <MetricCard
          title="Expected Monthly Demand"
          value={forecastData?.expected_monthly_kwh ? forecastData.expected_monthly_kwh.toLocaleString() : '0'}
          unit="kWh / month"
          icon={Zap}
          accentColor="teal"
        />

        <MetricCard
          title="Estimated Monthly Bill"
          value={formatCurrency(forecastData?.estimated_future_bill)}
          icon={DollarSign}
          accentColor="blue"
        />

        <MetricCard
          title="Potential Preventable Wastage"
          value={forecastData?.potential_wastage_kwh ? forecastData.potential_wastage_kwh.toLocaleString() : '0'}
          unit="kWh risk"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* Model Performance Evaluation Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] font-medium text-slate-400 uppercase">Validation MAE</p>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{forecastData?.mae || 0} kWh</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Mean Absolute Error</p>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] font-medium text-slate-400 uppercase">Validation RMSE</p>
          <p className="text-xl font-bold text-teal-400 mt-1 font-mono">{forecastData?.rmse || 0} kWh</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Root Mean Squared Error</p>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] font-medium text-slate-400 uppercase">Error Rate (MAPE)</p>
          <p className="text-xl font-bold text-blue-400 mt-1 font-mono">{forecastData?.mape || 4.2}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Mean Percentage Error</p>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] font-medium text-slate-400 uppercase">Statistical Confidence</p>
          <p className="text-xl font-bold text-purple-400 mt-1 font-mono">{forecastData?.confidence_level_pct || 95}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Residual Uncertainty Band</p>
        </div>
      </div>

      {/* Main Forecast Chart with Confidence Intervals */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold tracking-tight">Actual vs Predicted Demand Trajectory</h3>
            <p className="text-xs text-slate-400">
              Displaying historical actuals, predicted forecast points, and shaded 95% confidence intervals
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500" />
              <span>Historical Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-400 border-dashed" />
              <span>ML Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-teal-500/20 rounded-xs" />
              <span>95% Confidence Band</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
              <XAxis dataKey="forecast_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val, name) => [
                  typeof val === 'number' ? `${val.toLocaleString()} kWh` : val,
                  name === 'actual_kwh' ? 'Actual' : name === 'predicted_kwh' ? 'Predicted' : name,
                ]}
              />
              <Area
                type="monotone"
                dataKey="upper_bound"
                name="Upper Bound (95%)"
                stroke="none"
                fill="url(#ciGrad)"
              />
              <Area
                type="monotone"
                dataKey="lower_bound"
                name="Lower Bound (95%)"
                stroke="none"
                fill={isDark ? '#0f172a' : '#ffffff'}
              />
              <Line
                type="monotone"
                dataKey="actual_kwh"
                name="Actual Load"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="predicted_kwh"
                name="Forecast Predicted"
                stroke="#2dd4bf"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#2dd4bf' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Limitations Notice */}
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-300">Statistical Model Limitations & Assumptions</p>
          <p className="mt-1 leading-relaxed">
            {forecastData?.model_limitations ||
              'Forecast assumes continuous typical facility schedules and occupancy profiles. Unforeseen weather events or sudden equipment shutdowns may introduce variance outside standard confidence bounds.'}
          </p>
        </div>
      </div>
    </div>
  );
}
