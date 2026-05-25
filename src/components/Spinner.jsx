import React from 'react';

export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
      <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-400 border-t-transparent" />
      {label}...
    </div>
  );
}
