import React from 'react';

export default function LoginForm({ loginState, setLoginState, onSubmit }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Rail Madad Internal Login</h1>
        <p className="mt-2 text-sm text-slate-500">Use admin or department credentials for internal testing.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={loginState.email}
            onChange={(e) => setLoginState((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
            required
          />
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={loginState.password}
            onChange={(e) => setLoginState((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
            required
          />
          {loginState.error && <p className="text-sm text-red-600">{loginState.error}</p>}
          <button
            type="submit"
            disabled={loginState.loading}
            className="flex w-full justify-center rounded-xl bg-railnavy px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183f62] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loginState.loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        
        </div>
      </div>
    </div>
  );
}
