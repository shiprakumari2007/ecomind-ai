import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Leaf,
  Key,
  Database,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { isDark } = useTheme();
  const { config, refreshData, showNotification } = useApp();

  const [saving, setSaving] = useState(false);
  const [electricityRate, setElectricityRate] = useState(0.15);
  const [carbonFactor, setCarbonFactor] = useState(0.72);
  const [currency, setCurrency] = useState('USD');
  const [geminiKey, setGeminiKey] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    if (config) {
      setElectricityRate(config.electricity_rate || 0.15);
      setCarbonFactor(config.carbon_factor || 0.72);
      setCurrency(config.currency || 'USD');
    }
  }, [config]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        electricity_rate: parseFloat(electricityRate),
        carbon_factor: parseFloat(carbonFactor),
        currency: currency.trim(),
        gemini_api_key: geminiKey ? geminiKey.trim() : undefined,
      });
      showNotification('Global configuration updated successfully!', 'success');
      refreshData();
    } catch (err) {
      showNotification(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setSaving(true);
      await api.resetDatabase();
      showNotification('Database cleared successfully.', 'success');
      setResetConfirm(false);
      refreshData();
    } catch (err) {
      showNotification('Database reset failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setSaving(true);
      const res = await api.loadSampleDataset();
      showNotification(res.message, 'success');
      refreshData();
    } catch (err) {
      showNotification(err.message || 'Failed to load sample dataset.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40">
        <h2 className="text-lg font-bold tracking-tight">System Settings & Configuration</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure financial tariffs, regional carbon emission parameters, AI model keys, and database state.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } space-y-6`}
        >
          <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Financial & Emission Baseline Factors
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tariff Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Electricity Tariff ({currency} / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="5.0"
                value={electricityRate}
                onChange={(e) => setElectricityRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400">Used for energy bill and savings estimation</p>
            </div>

            {/* Carbon Factor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Grid Carbon Factor (kg CO2 / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="5.0"
                value={carbonFactor}
                onChange={(e) => setCarbonFactor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400">Standard Scope 2 regional grid emission factor</p>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Currency Code</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-100 font-semibold focus:outline-hidden focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
              <p className="text-[11px] text-slate-400">Global display currency unit</p>
            </div>
          </div>
        </div>

        {/* AI & Gemini Configuration */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
          } space-y-4`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Conversational AI Integration
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border ${
                config.has_gemini_key
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {config.has_gemini_key ? 'Gemini API Connected' : 'Rule-Based Fallback Active'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Google Gemini API Key (Optional)
            </label>
            <input
              type="password"
              placeholder={config.has_gemini_key ? '••••••••••••••••••••••••' : 'Enter AIzaSy... API key'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-hidden focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              If left blank, EcoMind AI automatically uses its intelligent, data-grounded expert fallback assistant.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>

      {/* Database Management Card */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        } space-y-4`}
      >
        <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Database Management & Seeding
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <div>
            <h4 className="text-xs font-bold text-slate-200">Demonstration Dataset</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Re-seed 17,280 hourly records spanning 6 months with realistic anomalies
            </p>
          </div>
          <button
            onClick={handleLoadSample}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition-colors"
          >
            Load Sample Dataset
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-red-950/20 border border-red-500/20">
          <div>
            <h4 className="text-xs font-bold text-red-300">Clear All Facility Data</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Permanently purges all energy records, anomalies, and generated reports from database
            </p>
          </div>

          {resetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDatabase}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            >
              Reset Database
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
