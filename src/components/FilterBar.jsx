import React from 'react';

export default function FilterBar({ filters, setFilters, isAdmin, setPage, statusOptions, urgencyOptions, categoryOptions }) {
  return (
    <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/80">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
          >
            {statusOptions.map((value) => (
              <option key={value} value={value}>{value || 'All'}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium text-slate-700">Urgency</label>
          <select
            value={filters.urgency}
            onChange={(e) => setFilters((prev) => ({ ...prev, urgency: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
          >
            {urgencyOptions.map((value) => (
              <option key={value} value={value}>{value || 'All'}</option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div className="min-w-[200px] flex-1">
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
            >
              {categoryOptions.map((value) => (
                <option key={value} value={value}>{value || 'All'}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() => setPage(1)}
          className="h-12 rounded-xl bg-railnavy px-6 text-sm font-semibold text-white hover:bg-[#183f62]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
