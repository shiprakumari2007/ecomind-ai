import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Leaf,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function RecommendationsPage() {
  const { isDark } = useTheme();
  const { formatCurrency, showNotification } = useApp();

  const [loading, setLoading] = useState(true);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('all');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.getRecommendations({
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
      });
      setRecommendationsData(res);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedPriority]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateRecommendationStatus(id, newStatus);
      showNotification(`Initiative updated to "${newStatus}".`, 'success');
      setRecommendationsData((prev) => ({
        ...prev,
        items: prev.items.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      }));
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading && !recommendationsData) {
    return <LoadingSpinner message="Synthesizing telemetry data into actionable recommendations..." />;
  }

  const items = recommendationsData?.items || [];
  const totalKwh = recommendationsData?.total_potential_kwh_savings || 0;
  const totalMoney = recommendationsData?.total_monetary_savings || 0;
  const totalCo2 = recommendationsData?.total_co2_reduction_kg || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">AI Sustainability Recommendation Engine</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Rule-Based + ML Synthesis
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirically grounded efficiency interventions with transparent assumptions, financial payback, and carbon abatement models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Cumulative Potential Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Potential Energy Saved"
          value={totalKwh ? totalKwh.toLocaleString() : '0'}
          unit="kWh / year"
          icon={Zap}
          subtitle="Annualized facility efficiency reduction"
          accentColor="emerald"
        />

        <MetricCard
          title="Total Annual Financial Savings"
          value={formatCurrency(totalMoney)}
          unit="/ year"
          icon={DollarSign}
          subtitle="Utility cost avoidance potential"
          accentColor="teal"
        />

        <MetricCard
          title="Scope 2 Carbon Abatement"
          value={totalCo2 ? (totalCo2 / 1000).toFixed(2) : '0'}
          unit="t CO2e / year"
          icon={Leaf}
          subtitle="Grid emission reductions"
          accentColor="blue"
        />
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {items.map((rec) => {
          const isImplemented = rec.status === 'Implemented';
          const isInProgress = rec.status === 'In Progress';

          return (
            <div
              key={rec.id}
              className={`p-6 rounded-2xl border transition-all duration-200 ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
              } hover:border-emerald-500/30 shadow-md`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-500/10">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      rec.priority === 'Critical'
                        ? 'bg-red-500/15 text-red-400'
                        : rec.priority === 'High'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          rec.priority === 'Critical'
                            ? 'bg-red-500/15 border-red-500/30 text-red-400'
                            : rec.priority === 'High'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {rec.category}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Difficulty: {rec.difficulty}
                      </span>
                    </div>
                    <h3 className="text-base font-bold tracking-tight mt-1.5">{rec.title}</h3>
                  </div>
                </div>

                {/* Status Switcher Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        rec.id,
                        isImplemented ? 'Pending' : isInProgress ? 'Implemented' : 'In Progress'
                      )
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isImplemented
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : isInProgress
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isImplemented && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {isInProgress && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Status: {rec.status}</span>
                  </button>
                </div>
              </div>

              {/* Problem & Action Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/30 space-y-1">
                  <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Identified Inefficiency & Empirical Evidence
                  </span>
                  <p className="text-slate-300 leading-relaxed">{rec.problem_statement}</p>
                  <p className="text-slate-400 text-[11px] pt-1">{rec.supporting_data}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="font-semibold text-emerald-300 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Suggested Action Plan
                  </span>
                  <p className="text-slate-200 leading-relaxed">{rec.suggested_action}</p>
                </div>
              </div>

              {/* Quantified Savings Strip */}
              <div className="pt-3 border-t border-slate-500/10 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-800/20">
                  <span className="text-[10px] text-slate-400 uppercase">Energy Savings</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">
                    {rec.est_savings_kwh.toLocaleString()} kWh/yr
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/20">
                  <span className="text-[10px] text-slate-400 uppercase">Financial Payback</span>
                  <p className="text-sm font-bold text-teal-400 mt-0.5 font-mono">
                    {formatCurrency(rec.est_monetary_savings)}/yr
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/20">
                  <span className="text-[10px] text-slate-400 uppercase">Carbon Offset</span>
                  <p className="text-sm font-bold text-blue-400 mt-0.5 font-mono">
                    {rec.est_co2_reduction.toLocaleString()} kg CO2/yr
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
