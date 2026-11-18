import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Moon,
  Clock,
  Zap,
  Play,
  Filter,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function AnomaliesPage() {
  const { isDark } = useTheme();
  const { showNotification } = useApp();

  const [loading, setLoading] = useState(true);
  const [runningModel, setRunningModel] = useState(false);
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [contamination, setContamination] = useState(0.03);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalies({
        severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
        department: selectedDept !== 'all' ? selectedDept : undefined,
      });
      setAnomaliesData(res);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [selectedSeverity, selectedDept]);

  const handleRunModel = async () => {
    try {
      setRunningModel(true);
      const res = await api.runAnomalyDetection(contamination);
      showNotification(res.message, 'success');
      await fetchAnomalies();
    } catch (err) {
      showNotification(err.message || 'Error running Isolation Forest model.', 'error');
    } finally {
      setRunningModel(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateAnomalyStatus(id, newStatus);
      showNotification(`Anomaly status updated to ${newStatus}.`, 'success');
      // Update local state smoothly
      setAnomaliesData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
      }));
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading && !anomaliesData) {
    return <LoadingSpinner message="Scanning dataset with Isolation Forest model..." />;
  }

  const items = anomaliesData?.items || [];
  const totalAnomalies = anomaliesData?.total_anomalies || 0;
  const criticalCount = anomaliesData?.critical_count || 0;
  const highCount = anomaliesData?.high_count || 0;
  const mediumCount = anomaliesData?.medium_count || 0;
  const lowCount = anomaliesData?.low_count || 0;

  // Scatter plot data mapping
  const scatterData = items.slice(0, 150).map((a, idx) => ({
    x: idx,
    timestamp: a.timestamp,
    energy_kwh: a.energy_kwh,
    expected_kwh: a.expected_kwh,
    department: a.department,
    appliance: a.appliance,
    severity: a.severity,
  }));

  return (
    <div className="space-y-6">
      {/* Header and Model Control */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">AI Energy Anomaly Detection</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Isolation Forest
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unsupervised machine learning model identifying multidimensional load deviations,
            overnight energy leaks, and zero-occupancy wastage with explainable diagnoses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Contamination:</span>
            <select
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-hidden"
            >
              <option value="0.01">1% (Conservative)</option>
              <option value="0.03">3% (Standard)</option>
              <option value="0.05">5% (Aggressive)</option>
            </select>
          </div>

          <button
            onClick={handleRunModel}
            disabled={runningModel}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${runningModel ? 'animate-spin' : ''}`} />
            {runningModel ? 'Fitting Model...' : 'Execute Model Scan'}
          </button>
        </div>
      </div>

      {/* Severity Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedSeverity('Critical')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedSeverity === 'Critical'
              ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10'
              : isDark
              ? 'bg-slate-900/70 border-slate-800 hover:border-red-500/40'
              : 'bg-white border-slate-200 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-red-400">Critical</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-red-400">{criticalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">&gt; 2.8x expected baseline</p>
        </div>

        <div
          onClick={() => setSelectedSeverity('High')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedSeverity === 'High'
              ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
              : isDark
              ? 'bg-slate-900/70 border-slate-800 hover:border-amber-500/40'
              : 'bg-white border-slate-200 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-400">High</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-400">{highCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">2.0x - 2.8x deviation</p>
        </div>

        <div
          onClick={() => setSelectedSeverity('Medium')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedSeverity === 'Medium'
              ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/10'
              : isDark
              ? 'bg-slate-900/70 border-slate-800 hover:border-yellow-500/40'
              : 'bg-white border-slate-200 hover:border-yellow-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-yellow-400">Medium</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-yellow-400">{mediumCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Unoccupied hours & leaks</p>
        </div>

        <div
          onClick={() => setSelectedSeverity('all')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedSeverity === 'all'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
              : isDark
              ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/40'
              : 'bg-white border-slate-200 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-400">All Flagged</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-400">{totalAnomalies}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total isolated records</p>
        </div>
      </div>

      {/* Visual Anomaly Timeline & Dispersion Chart */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold tracking-tight">Anomaly Distribution & Load Discrepancy</h3>
            <p className="text-xs text-slate-400">Monitored actual spike (kWh) vs anticipated normal baseline</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
              <XAxis dataKey="x" name="Sequence" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis dataKey="energy_kwh" name="Energy kWh" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val, name, item) => [
                  `${val} kWh (Expected: ${item.payload.expected_kwh} kWh)`,
                  `${item.payload.department} - ${item.payload.appliance}`,
                ]}
                labelFormatter={(_, arr) => arr[0]?.payload?.timestamp || ''}
              />
              <Scatter name="Anomalous Records" data={scatterData} fill="#ef4444" shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies Table with Explainable Reason and Action Buttons */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight">Isolated Anomaly Incidents</h3>
            <p className="text-xs text-slate-400">
              Each flagged anomaly includes explainable domain conditions and verification controls
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-500/20 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3 text-right">Actual</th>
                <th className="py-2.5 px-3 text-right">Expected</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Explainable Root Cause</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-500/10">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/20 font-sans">
                  <td className="py-3 px-3 font-mono text-slate-300">{a.timestamp}</td>
                  <td className="py-3 px-3 font-medium text-teal-400">{a.department}</td>
                  <td className="py-3 px-3 text-slate-300">{a.appliance}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-red-400">
                    {a.energy_kwh.toFixed(1)} kWh
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {a.expected_kwh.toFixed(1)} kWh
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        a.severity === 'Critical'
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : a.severity === 'High'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-md">
                    <p className="line-clamp-2">{a.reason}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <select
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border focus:outline-hidden ${
                        a.status === 'Resolved'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : a.status === 'Investigating'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Ignored">Ignored</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
