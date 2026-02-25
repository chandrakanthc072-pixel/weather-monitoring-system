import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

const val = (v, fallback = '—') =>
  v !== null && v !== undefined && v !== '' ? v : fallback;

/* ─── confirm modal ───────────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
      <p className="text-lg font-semibold text-white mb-6 text-center">{message}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={onCancel}
          className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition">
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─── main component ──────────────────────────────────────── */
const AdminPanel = () => {
  const [users, setUsers]           = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [activeTab, setActiveTab]   = useState('users');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirm, setConfirm]       = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, historyRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/all-history'),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setAllHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/admin/history/${id}`);
      setAllHistory(prev => prev.filter(h => h._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirm(null);
    }
  };

  const totalSearches = allHistory.length;
  const uniqueCities  = new Set(allHistory.map(h => h.city)).size;
  const avgTemp       = allHistory.length
    ? Math.round(allHistory.reduce((a, h) => a + (h.temperature || 0), 0) / allHistory.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      {confirm && (
        <ConfirmModal
          message="🗑️ Delete this history record? This cannot be undone."
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleDeleteHistory(confirm.id)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold mb-1">⚙️ Admin Dashboard</h1>
        <p className="text-gray-400 mb-8">Monitor all users and their weather search activity.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users',    value: users.length,   icon: '👥', color: 'text-blue-400' },
            { label: 'Total Searches', value: totalSearches,  icon: '🔍', color: 'text-green-400' },
            { label: 'Unique Cities',  value: uniqueCities,   icon: '🌍', color: 'text-purple-400' },
            { label: 'Avg Temp (°C)',  value: `${avgTemp}°C`, icon: '🌡️', color: 'text-orange-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow">
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 rounded-xl p-1 w-fit">
          {['users', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'users' ? '👥 Users' : '📋 All Searches'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-xl">
            <span className="animate-spin mr-3 text-3xl">⏳</span> Loading…
          </div>
        ) : (
          <>
            {/* ── Users Table ── */}
            {activeTab === 'users' && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="font-bold text-lg">Registered Users</h2>
                  <span className="text-sm text-gray-400">{users.length} total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found.</td>
                        </tr>
                      ) : users.map((u, i) => (
                        <tr key={u._id} className="hover:bg-gray-700/30 transition">
                          <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                          <td className="px-6 py-4 font-semibold">{val(u.name)}</td>
                          <td className="px-6 py-4 text-gray-300">{val(u.email)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(u.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── All History Table with Delete ── */}
            {activeTab === 'history' && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="font-bold text-lg">All Search History</h2>
                  <span className="text-sm text-gray-400">{allHistory.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">City</th>
                        <th className="px-6 py-4">Temp</th>
                        <th className="px-6 py-4">Condition</th>
                        <th className="px-6 py-4">Humidity</th>
                        <th className="px-6 py-4">Wind</th>
                        <th className="px-6 py-4">Searched At</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {allHistory.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No search history found.</td>
                        </tr>
                      ) : allHistory.map((h, i) => (
                        <tr key={h._id} className="hover:bg-gray-700/30 transition group">
                          <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{val(h.user?.name)}</div>
                            <div className="text-xs text-gray-500">{val(h.user?.email)}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-300">{val(h.city)}</td>
                          <td className="px-6 py-4 font-bold text-white">{val(h.temperature)}°C</td>
                          <td className="px-6 py-4 text-gray-300">{val(h.condition)}</td>
                          <td className="px-6 py-4 text-cyan-400">{val(h.humidity)}%</td>
                          <td className="px-6 py-4 text-gray-300">{val(h.windSpeed)} km/h</td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(h.searchedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setConfirm({ id: h._id })}
                              disabled={deletingId === h._id}
                              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/50 border border-red-500/30 text-red-400 hover:text-red-200 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                              title="Delete this record"
                            >
                              {deletingId === h._id ? '⏳' : '🗑️ Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
