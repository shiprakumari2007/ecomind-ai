import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Database,
  CheckCircle2,
  Table,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function UploadPage() {
  const { isDark } = useTheme();
  const { refreshData, showNotification } = useApp();

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const res = await api.getDatasetPreview(15);
      setPreviewData(res);
    } catch (err) {
      console.error('Failed to load dataset preview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      setUploadStatus(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.uploadDataset(formData, replaceExisting);
      setUploadStatus({
        type: 'success',
        message: res.message,
        report: res.quality_report,
      });
      showNotification('Dataset uploaded and processed successfully!', 'success');
      refreshData();
      await fetchPreview();
      setFile(null);
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Failed to process dataset file.',
      });
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setLoading(true);
      setUploadStatus(null);
      const res = await api.loadSampleDataset();
      setUploadStatus({
        type: 'success',
        message: res.message,
      });
      showNotification('Sample 6-month demonstration dataset loaded successfully!', 'success');
      refreshData();
      await fetchPreview();
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Failed to load sample dataset.',
      });
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const qualityReport = previewData?.quality_report;
  const sampleRecords = previewData?.sample_records || [];
  const totalRecords = previewData?.total_records || 0;

  return (
    <div className="space-y-6">
      {/* Header and Quick Sample Loader */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Energy Data Upload & Ingestion</h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload CSV or Excel files with multi-variate telemetry (timestamp, building, department, appliance, kWh, temp, occupancy, rate).
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          Load 6-Month Demonstration Dataset
        </button>
      </div>

      {/* Upload Box & Quality Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div
          className={`lg:col-span-2 p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="text-base font-bold tracking-tight mb-4">File Ingestion</h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : isDark
                  ? 'border-slate-700 hover:border-emerald-500/50 bg-slate-950/40'
                  : 'border-slate-300 hover:border-emerald-500/50 bg-slate-50'
              }`}
            >
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {file ? file.name : 'Drag & drop your CSV or Excel file here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .csv, .xlsx, .xls up to 50MB (automatic missing value imputation)
                </p>
              </div>

              <input
                type="file"
                id="file-upload"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700 transition-colors"
              >
                Browse Files
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-400"
                />
                <span>Replace existing records in database</span>
              </label>

              <button
                type="submit"
                disabled={!file || loading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-sm transition-all flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                Process & Ingest Dataset
              </button>
            </div>
          </form>

          {/* Upload Status Alert */}
          {uploadStatus && (
            <div
              className={`mt-4 p-4 rounded-xl text-xs border ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quality Score Profile */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold tracking-tight">Data Quality Audit</h3>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="w-4 h-4" />
              </span>
            </div>

            {qualityReport ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-400">Quality Score</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {qualityReport.quality_score} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      style={{ width: `${qualityReport.quality_score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2 divide-y divide-slate-500/10">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Total Valid Records</span>
                    <span className="font-mono font-medium">{qualityReport.valid_rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Missing Values Handled</span>
                    <span className="font-mono text-emerald-400">{qualityReport.missing_values_count}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Duplicate Rows Cleaned</span>
                    <span className="font-mono text-emerald-400">{qualityReport.duplicate_rows}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Departments Detected</span>
                    <span className="font-mono font-medium">{qualityReport.departments_detected?.length || 0}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Appliances Monitored</span>
                    <span className="font-mono font-medium">{qualityReport.appliances_detected?.length || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active dataset profile available.</p>
            )}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-800/40 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              The data cleaner standardizes ISO timestamps, ensures non-negative kWh, and normalizes telemetry for ML anomaly models.
            </span>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold tracking-tight">Dataset Records Preview</h3>
          </div>
          <span className="text-xs text-slate-400">
            Displaying first {sampleRecords.length} of {totalRecords.toLocaleString()} rows
          </span>
        </div>

        {sampleRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-500/20 text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Building</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Appliance</th>
                  <th className="py-2.5 px-3 text-right">Energy (kWh)</th>
                  <th className="py-2.5 px-3 text-right">Temp (°C)</th>
                  <th className="py-2.5 px-3 text-right">Occupancy</th>
                  <th className="py-2.5 px-3 text-right">Rate ($/kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {sampleRecords.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-800/20 font-mono">
                    <td className="py-2 px-3 text-slate-300">{r.timestamp}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{r.building}</td>
                    <td className="py-2 px-3 text-teal-400 font-sans">{r.department}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{r.appliance}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                      {r.energy_consumption_kwh.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{r.temperature}°C</td>
                    <td className="py-2 px-3 text-right text-slate-300">{r.occupancy}</td>
                    <td className="py-2 px-3 text-right text-slate-300">${r.electricity_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No energy records currently loaded. Please upload a dataset or click "Load 6-Month Demonstration Dataset".
          </div>
        )}
      </div>
    </div>
  );
}
