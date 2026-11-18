import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading intelligence telemetry...' }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-teal-400 animate-ping" />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400 animate-pulse">{message}</p>
    </div>
  );
}
