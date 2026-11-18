import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownToLine,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function ReportsPage() {
  const { isDark } = useTheme();
  const { showNotification } = useApp();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [latestReport, setLatestReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const list = await api.listReports();
      setReports(list);
    } catch (err) {
      console.error('Failed to load reports catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const res = await api.generateReport();
      setLatestReport(res);
      showNotification('Executive PDF Sustainability Report generated successfully!', 'success');
      await fetchReports();
    } catch (err) {
      showNotification(err.message || 'Failed to generate PDF report.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Generator Action */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Executive Sustainability PDF Reports</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Publication Quality
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate formal sustainability audits, anomaly summaries, predictive forecasts, and roadmap tables in branded PDF format.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-200" />}
          {generating ? 'Compiling PDF Document...' : 'Generate New PDF Audit Report'}
        </button>
      </div>

      {/* Latest Report Ready Banner */}
      {latestReport && (
        <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">{latestReport.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Ready for download • {latestReport.filename} ({latestReport.file_size_kb} KB)
              </p>
            </div>
          </div>

          <a
            href={latestReport.download_url}
            download
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Download PDF
          </a>
        </div>
      )}

      {/* Report Inclusions Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Scorecard & Consumption
          </div>
          <p className="text-slate-400 text-[11px]">
            Total kWh, bill estimation, carbon footprint (tCO2e), and departmental breakdown tables.
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Anomalies & ML Forecasts
          </div>
          <p className="text-slate-400 text-[11px]">
            Isolation Forest incident diagnostics, model validation metrics (MAE/RMSE), and 30-day projection.
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Actionable Roadmap
          </div>
          <p className="text-slate-400 text-[11px]">
            Prioritized initiatives with financial ROI, carbon savings, and phased implementation timelines.
          </p>
        </div>
      </div>

      {/* Generated Reports History Catalog */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold tracking-tight">Report Archive & Downloads</h3>
          </div>
          <span className="text-xs text-slate-400">{reports.length} Reports Generated</span>
        </div>

        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-500/20 text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Report Title</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">File Size</th>
                  <th className="py-2.5 px-3">Date Generated</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-semibold text-slate-200">{r.title}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{r.filename}</td>
                    <td className="py-3 px-3 text-slate-300">{r.file_size_kb} KB</td>
                    <td className="py-3 px-3 text-slate-400">{r.created_at}</td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={r.download_url}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors font-medium text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No reports have been compiled yet. Click "Generate New PDF Audit Report" to build your first executive document.
          </div>
        )}
      </div>
    </div>
  );
}
