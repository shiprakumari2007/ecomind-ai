import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MetricCard({
  title,
  value,
  unit,
  change,
  changeLabel = 'vs previous period',
  isNegativeGood = false,
  icon: Icon,
  accentColor = 'emerald', // emerald, teal, amber, red, blue
  subtitle,
}) {
  const { isDark } = useTheme();

  const isNumericChange = typeof change === 'number' && !isNaN(change);
  const isPositive = change > 0;
  const isGood = isNegativeGood ? !isPositive : isPositive;

  const colorStyles = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      glow: 'shadow-emerald-500/5',
    },
    teal: {
      border: 'border-teal-500/20 hover:border-teal-500/40',
      iconBg: isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600',
      glow: 'shadow-teal-500/5',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
      glow: 'shadow-amber-500/5',
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      iconBg: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
      glow: 'shadow-red-500/5',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
      glow: 'shadow-blue-500/5',
    },
  }[accentColor] || {};

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] shadow-lg ${colorStyles.glow} ${
        isDark
          ? `bg-slate-900/70 ${colorStyles.border} backdrop-blur-xl`
          : `bg-white ${colorStyles.border} shadow-slate-200/50`
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(isNumericChange || subtitle) && (
        <div className="mt-4 pt-3 border-t border-slate-500/10 flex items-center justify-between text-xs">
          {isNumericChange && (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                  isGood
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {Math.abs(change)}%
              </span>
              <span className="text-slate-400">{changeLabel}</span>
            </div>
          )}

          {subtitle && !isNumericChange && (
            <span className="text-slate-400 text-[11px]">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
