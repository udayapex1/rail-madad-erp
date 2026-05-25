import React from 'react';

export default function Header({ headerLabel, user, onLogout }) {
  return (
    <header className="bg-railnavy px-6 py-5 shadow-lg shadow-slate-500/10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{headerLabel}</h1>
          <p className="text-sm text-slate-200">Logged in as {user?.firstName || user?.name || 'User'} ({user?.role?.replace('_', ' ')})</p>
        </div>
        <button onClick={onLogout} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-railnavy shadow-sm hover:bg-slate-100">
          Logout
        </button>
      </div>
    </header>
  );
}
