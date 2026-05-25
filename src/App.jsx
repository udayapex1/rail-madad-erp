import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Header from './components/Header.jsx';
import LoginForm from './components/LoginForm.jsx';
import FilterBar from './components/FilterBar.jsx';
import { StatusBadge, UrgencyBadge } from './components/Badges.jsx';
import Spinner from './components/Spinner.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const BASE_URL = 'https://rail-madad-minor.onrender.com/api';
const statusOptions = ['', 'Pending', 'InProgress', 'Resolved', 'Rejected'];
const urgencyOptions = ['', 'High', 'Medium', 'Low'];
const categoryOptions = ['', 'Cleaning', 'Safety', 'Food', 'Ticketing', 'Infrastructure', 'Other'];

function App() {
  const { auth, login, logout: contextLogout } = useAuth();
  const [loginState, setLoginState] = useState({ email: '', password: '', error: '', loading: false });
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('complaints');
  const [filters, setFilters] = useState({ status: '', urgency: '', category: '' });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [activeUpdateId, setActiveUpdateId] = useState('');
  const [updateForm, setUpdateForm] = useState({ status: 'Pending', note: '' });
  const [statusMessage, setStatusMessage] = useState('');

  const isAdmin = auth?.user?.role === 'admin';
  const isDepartmentEmployee = auth?.user?.role === 'department_employee';

  useEffect(() => {
    if (!auth) return;
    if (!isAdmin && !isDepartmentEmployee) return;
    if (isAdmin && viewMode === 'users') {
      loadUsers();
      return;
    }
    if (isAdmin && viewMode === 'stats') {
      loadStats();
      return;
    }
    loadComplaints();
  }, [auth, filters, page, viewMode]);

  const axiosInstance = useMemo(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth?.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers,
    });
  }, [auth?.token]);

  async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toLowerCase();
    const headers = { ...(options.headers || {}) };
    let data = options.data;
    if (!data && options.body) {
      try {
        data = JSON.parse(options.body);
      } catch (e) {
        data = options.body;
      }
    }

    try {
      const res = await axiosInstance.request({
        url: path,
        method,
        data,
        headers,
      });
      return res.data;
    } catch (err) {
      if (err.response) {
        const res = err.response;
        const dataResp = res.data;
        if (res.status === 401) {
          logout();
          throw new Error('Unauthorized');
        }
        if (res.status === 403) throw new Error(dataResp?.message || 'Access Denied');
        if (res.status === 404) throw new Error(dataResp?.message || 'Complaint not found');
        throw new Error(dataResp?.message || res.statusText || 'Request failed');
      }
      throw new Error('Server unreachable');
    }
  }

  function logout() {
    contextLogout();
    setComplaints([]);
    setPage(1);
    setFilters({ status: '', urgency: '', category: '' });
    setApiError('');
    setLoginState({ email: '', password: '', error: '', loading: false });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginState((prev) => ({ ...prev, loading: true, error: '' }));
    setApiError('');
    try {
      const payload = { email: loginState.email.trim(), password: loginState.password };
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const user = data?.data?.user || data?.user;
      const token = data?.data?.token || data?.token || null;
      if (!user) {
        throw new Error('Invalid login response');
      }
      login(user, token);
      setPage(1);
      setFilters({ status: '', urgency: '', category: '' });
    } catch (error) {
      setLoginState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setLoginState((prev) => ({ ...prev, loading: false }));
    }
  }

  async function loadComplaints() {
    setLoading(true);
    setApiError('');
    setStatusMessage('');
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.urgency) params.set('urgency', filters.urgency);
      if (isAdmin && filters.category) params.set('category', filters.category);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const path = isAdmin ? `/complaints/all?${params}` : `/complaints/department-complaints?${params}`;
      const data = await apiFetch(path);
      const payload = data?.complaints || data?.items || data?.data || data;
      setComplaints(Array.isArray(payload) ? payload : []);
      const computedTotal = data?.totalPages || (data?.total ? Math.ceil(data.total / limit) : 1);
      setTotalPages(Math.max(1, computedTotal));
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    setApiError('');
    setStatusMessage('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      const data = await apiFetch(`/auth/users?${params}`);
      const payload = data?.users || data?.data || data;
      setUsers(Array.isArray(payload) ? payload : []);
      const computedTotal = data?.totalPages || (data?.total ? Math.ceil(data.total / limit) : 1);
      setTotalPages(Math.max(1, computedTotal));
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setLoading(true);
    setApiError('');
    setStatusMessage('');
    try {
      const data = await apiFetch(`/complaints/admin/stats`);
      setStats(data?.data || null);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Delete this user account? This action cannot be undone.')) return;
    setLoading(true);
    setApiError('');
    setStatusMessage('');
    try {
      const res = await apiFetch(`/auth/users/${userId}`, {
        method: 'DELETE',
      });
      setStatusMessage(res?.message || 'User account deleted successfully.');
      loadUsers();
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(complaintId) {
    setLoading(true);
    setApiError('');
    setStatusMessage('');
    try {
      // Validate status
      console.log(complaintId)
      const allowed = ['Pending', 'InProgress', 'Resolved', 'Rejected'];
      if (!allowed.includes(updateForm.status)) {
        throw new Error('Invalid status value');
      }

      const res = await apiFetch(`/complaints/${complaintId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: updateForm.status, note: updateForm.note.trim() }),
      });

      setStatusMessage(res?.message || 'Status updated successfully.');
      setActiveUpdateId('');
      setUpdateForm({ status: 'Pending', note: '' });
      loadComplaints();
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Badge components moved to src/components/Badges.jsx

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getDisplayName(value) {
    if (!value && value !== 0) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.firstName || value.lastName) return `${value.firstName || ''} ${value.lastName || ''}`.trim();
      if (value.email) return value.email;
      return JSON.stringify(value);
    }
    return String(value);
  }

  if (!auth) {
    return <LoginForm loginState={loginState} setLoginState={setLoginState} onSubmit={handleLogin} />;
  }

  if (!isAdmin && !isDepartmentEmployee) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
          <p className="mt-3 text-slate-600">Your account role is not permitted to use this dashboard.</p>
          <button onClick={logout} className="mt-6 rounded-xl bg-railnavy px-5 py-3 text-sm font-semibold text-white hover:bg-[#183f62]">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const headerLabel = isAdmin ? 'Rail Madad — Admin Portal' : `Rail Madad — ${getDisplayName(auth.user.department) || 'Your Department'} Dashboard`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header headerLabel={headerLabel} user={auth.user} onLogout={logout} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {isAdmin && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-3xl bg-white p-3 shadow-sm shadow-slate-200/80">
              <button
                onClick={() => { setViewMode('complaints'); setPage(1); setApiError(''); setStatusMessage(''); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'complaints' ? 'bg-railnavy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Complaints
              </button>
              <button
                onClick={() => { setViewMode('users'); setPage(1); setApiError(''); setStatusMessage(''); }}
                className={`ml-3 rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'users' ? 'bg-railnavy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Users
              </button>
              <button
                onClick={() => { setViewMode('stats'); setPage(1); setApiError(''); setStatusMessage(''); }}
                className={`ml-3 rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'stats' ? 'bg-railnavy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Dashboard Stats
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {viewMode === 'users' ? 'Viewing registered user accounts.' : viewMode === 'stats' ? 'Viewing dashboard statistics.' : 'Viewing complaints for the dashboard.'}
            </p>
          </div>
        )}

        {viewMode === 'complaints' && (
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            isAdmin={isAdmin}
            setPage={setPage}
            statusOptions={statusOptions}
            urgencyOptions={urgencyOptions}
            categoryOptions={categoryOptions}
          />
        )}

        {viewMode === 'stats' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/80">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System Statistics</h2>
                <p className="text-sm text-slate-500">Overview of complaints and registered users.</p>
                {apiError && <p className="mt-2 text-sm text-red-600">{apiError}</p>}
              </div>
              {loading && <Spinner label="Loading stats" />}
            </div>
            
            {stats && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-4 text-base font-semibold text-slate-800">Complaints Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(stats.complaints || {}).map(([key, value]) => (
                        <div key={key} className={`rounded-xl p-4 ${key === 'Total' ? 'col-span-2 bg-railnavy text-white' : 'bg-white shadow-sm'}`}>
                          <p className={`text-xs font-medium uppercase tracking-wider ${key === 'Total' ? 'text-slate-200' : 'text-slate-500'}`}>{key}</p>
                          <p className={`mt-1 text-2xl font-bold ${key === 'Total' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-4 text-base font-semibold text-slate-800">Users Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(stats.users || {}).map(([key, value]) => (
                        <div key={key} className={`rounded-xl p-4 ${key === 'Total' ? 'col-span-2 bg-railnavy text-white' : 'bg-white shadow-sm'}`}>
                          <p className={`text-xs font-medium uppercase tracking-wider ${key === 'Total' ? 'text-slate-200' : 'text-slate-500'}`}>{key.replace('_', ' ')}</p>
                          <p className={`mt-1 text-2xl font-bold ${key === 'Total' ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-6 text-center text-sm font-semibold text-slate-700 uppercase tracking-wide">Complaints by Status</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(stats.complaints || {}).filter(([k]) => k !== 'Total').map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {Object.entries(stats.complaints || {}).filter(([k]) => k !== 'Total').map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Complaints']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-6 text-center text-sm font-semibold text-slate-700 uppercase tracking-wide">Users by Role</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(stats.users || {}).filter(([k]) => k !== 'Total').map(([name, value]) => ({ name: name.replace('_', ' '), value }))}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="value" fill="#1F4E79" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode !== 'stats' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/80">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                {viewMode === 'users' ? 'Showing all users in the system.' : 'Showing complaints for current filters.'}
              </p>
              {apiError && <p className="mt-2 text-sm text-red-600">{apiError}</p>}
              {statusMessage && <p className="mt-2 text-sm text-emerald-600">{statusMessage}</p>}
            </div>
            {loading && <Spinner label={viewMode === 'users' ? 'Loading users' : 'Loading complaints'} />}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                {viewMode === 'users' ? (
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 font-medium">Complaint ID</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Urgency</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {isAdmin && <th className="px-4 py-3 font-medium">Department</th>}
                    <th className="px-4 py-3 font-medium">Submitted By</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-200">
                {viewMode === 'users' ? (
                  users.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={5} className="whitespace-nowrap px-4 py-6 text-center text-sm text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const userId = user._id || user.id || user.email || 'user';
                      return (
                        <tr key={userId} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-slate-700">{getDisplayName(user)}</td>
                          <td className="px-4 py-4 text-slate-700">{user.email || 'N/A'}</td>
                          <td className="px-4 py-4 text-slate-700">{user.role?.replace('_', ' ') || 'N/A'}</td>
                          <td className="px-4 py-4 text-slate-700">{getDisplayName(user.department)}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleDeleteUser(userId)}
                              className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : complaints.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="whitespace-nowrap px-4 py-6 text-center text-sm text-slate-500">
                      No complaints found for current filters.
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => {
                    const complaintId = complaint.complaintId || complaint.complaintId || 'N/A';
                    const isExpanded = expandedId === complaintId;
                    const isUpdateOpen = activeUpdateId === complaintId;
                    return (
                      <tbody key={complaintId}>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-medium text-slate-800">{complaintId}</td>
                          <td className="px-4 py-4 text-slate-700">{complaint.category || 'N/A'}</td>
                          <td className="px-4 py-4"><UrgencyBadge value={complaint.urgency} /></td>
                          <td className="px-4 py-4"><StatusBadge value={complaint.status} /></td>
                          {isAdmin && <td className="px-4 py-4 text-slate-700">{getDisplayName(complaint.department)}</td>}
                          <td className="px-4 py-4 text-slate-700">{getDisplayName(complaint.submittedBy)}</td>
                          <td className="px-4 py-4 text-slate-700">{formatDate(complaint.createdAt || complaint.date)}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                onClick={() => setExpandedId(isExpanded ? '' : complaintId)}
                                className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                {isExpanded ? 'Collapse' : 'Details'}
                              </button>
                              {(isDepartmentEmployee || isAdmin) && (
                                <button
                                  onClick={() => {
                                    setActiveUpdateId(isUpdateOpen ? '' : complaintId);
                                    setUpdateForm({ status: complaint.status || 'Pending', note: '' });
                                  }}
                                  className="rounded-full bg-railnavy px-3 py-2 text-xs font-semibold text-white hover:bg-[#183f62]"
                                >
                                  {isUpdateOpen ? 'Close' : 'Update Status'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50">
                            <td colSpan={isAdmin ? 7 : 6} className="px-4 py-4">
                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-900">Complaint Details</h3>
                                  <p className="mt-2 text-sm text-slate-700">{complaint.description || complaint.details || 'No additional details provided.'}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
                                  {Array.isArray(complaint.timeline) && complaint.timeline.length > 0 ? (
                                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                      {complaint.timeline.map((item, index) => (
                                        <li key={index} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                                          <p className="font-medium text-slate-800">{item.title || item.status || `Step ${index + 1}`}</p>
                                          <p className="text-slate-600">{item.note || item.description || item.comment || 'No details.'}</p>
                                          <p className="mt-1 text-xs text-slate-500">{formatDate(item.date || item.createdAt)}</p>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-2 text-sm text-slate-600">Timeline data is not available.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {isUpdateOpen && (
                          <tr className="bg-slate-50">
                            <td colSpan={isAdmin ? 7 : 6} className="px-4 py-4">
                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-900">Update Complaint Status</h3>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                  <label className="block text-sm font-medium text-slate-700">
                                    Status
                                    <select
                                      value={updateForm.status}
                                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
                                    >
                                      {statusOptions.slice(1).map((value) => (
                                        <option key={value} value={value}>{value}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                                    Note (optional)
                                    <textarea
                                      value={updateForm.note}
                                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, note: e.target.value }))}
                                      rows="3"
                                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-railnavy focus:ring-2 focus:ring-railnavy/20"
                                    />
                                  </label>
                                </div>
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                  <button
                                    onClick={() => setActiveUpdateId('')}
                                    className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(complaintId)}
                                    className="rounded-xl bg-railnavy px-5 py-3 text-sm font-semibold text-white hover:bg-[#183f62]"
                                  >
                                    Submit Update
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>Page {page} of {totalPages}</p>
            <div className="flex gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

export default App;
