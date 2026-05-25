import React from 'react';

export function StatusBadge({ value }) {
  const classes = {
    Pending: 'bg-amber-100 text-amber-700',
    InProgress: 'bg-sky-100 text-sky-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes[value] || 'bg-slate-100 text-slate-700'}`}>{value || 'Unknown'}</span>;
}

export function UrgencyBadge({ value }) {
  const classes = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes[value] || 'bg-slate-100 text-slate-700'}`}>{value || 'Unknown'}</span>;
}
