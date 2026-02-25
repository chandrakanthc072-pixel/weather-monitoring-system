import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
);

/* ─── helpers ─────────────────────────────────────────────── */
const val = (v, fallback = '—') =>
  v !== null && v !== undefined && v !== '' ? v : fallback;

const getBg = (desc = '') => {
  const d = desc.toLowerCase();
  if (d.includes('sunny') || d.includes('clear'))   return 'from-amber-900/40 via-orange-900/30 to-gray-900';
  if (d.includes('rain') || d.includes('drizzle'))  return 'from-blue-900/50 via-slate-800/40 to-gray-900';
  if (d.includes('snow') || d.includes('blizzard')) return 'from-sky-900/40 via-blue-900/30 to-gray-900';
  if (d.includes('thunder') || d.includes('storm')) return 'from-purple-900/50 via-gray-800/40 to-gray-900';
  if (d.includes('cloud') || d.includes('overcast'))return 'from-slate-700/40 via-gray-800/30 to-gray-900';
  if (d.includes('fog') || d.includes('mist'))      return 'from-gray-700/40 via-gray-800/30 to-gray-900';
  return 'from-indigo-900/40 via-gray-800/30 to-gray-900';
};

const getEmoji = (desc = '') => {
  const d = desc.toLowerCase();
  if (d.includes('sunny'))    return '☀️';
  if (d.includes('clear'))    return '🌙';
  if (d.includes('partly'))   return '⛅';
  if (d.includes('cloud'))    return '☁️';
  if (d.includes('overcast')) return '🌫️';
  if (d.includes('rain'))     return '🌧️';
  if (d.includes('drizzle'))  return '🌦️';
  if (d.includes('snow'))     return '❄️';
  if (d.includes('thunder'))  return '⛈️';
  if (d.includes('fog'))      return '🌁';
  if (d.includes('mist'))     return '🌫️';
  if (d.includes('blizzard')) return '🌨️';
  return '🌡️';
};

/* ─── confirm dialog ──────────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
      <p className="text-lg font-semibold text-white mb-6 text-center">{message}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─── main component ──────────────────────────────────────── */
const Dashboard = () => {
  const [city, setCity]         = useState('');
  const [weather, setWeather]   = useState(null);
  const [history, setHistory]   = useState([]);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unit, setUnit]         = useState('C');
  const [deletingId, setDeletingId]   = useState(null); // id being deleted
  const [clearingAll, setClearingAll] = useState(false);
  const [confirm, setConfirm]   = useState(null); // { type: 'single'|'all', id? }
  const autoRef = useRef(null);

  /* convert temp */
  const toDisplay = (c) => {
    if (c === null || c === undefined) return '—';
    return unit === 'C' ? `${c}°C` : `${Math.round(c * 9 / 5 + 32)}°F`;
  };

  /* fetch weather */
  const fetchWeather = async (e, overrideCity) => {
    if (e) e.preventDefault();
    const target = overrideCity || city;
    if (!target.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/weather/${encodeURIComponent(target)}`);
      setWeather(data);
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching weather');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  /* fetch history */
  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/weather/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  /* delete single */
  const handleDeleteOne = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/weather/history/${id}`);
      setHistory(prev => prev.filter(h => h._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirm(null);
    }
  };

  /* clear all */
  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await api.delete('/weather/history/all');
      setHistory([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Clear failed');
    } finally {
      setClearingAll(false);
      setConfirm(null);
    }
  };

  /* auto-refresh */
  useEffect(() => {
    fetchHistory();
    autoRef.current = setInterval(() => {
      if (weather?.location?.name) fetchWeather(null, weather.location.name);
    }, 60000);
    return () => clearInterval(autoRef.current);
  }, []);

  /* chart */
  const chartSlice  = history.slice(0, 10).reverse();
  const chartLabels = chartSlice.map(h =>
    new Date(h.searchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: chartSlice.map(h => h.temperature),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#3b82f6', pointRadius: 4,
      },
      {
        label: 'Humidity (%)',
        data: chartSlice.map(h => h.humidity),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.10)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#10b981', pointRadius: 4,
      },
    ],
  };
  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 12 } } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: '#374151' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: '#374151' } },
    },
  };

  const desc    = weather?.current?.weather_descriptions?.[0] || '';
  const bgClass = getBg(desc);
  const emoji   = getEmoji(desc);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} text-white transition-all duration-700`}>
      <Navbar />

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          message={
            confirm.type === 'all'
              ? '🗑️ Delete ALL search history? This cannot be undone.'
              : '🗑️ Delete this search record?'
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            confirm.type === 'all' ? handleClearAll() : handleDeleteOne(confirm.id)
          }
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Search Bar ── */}
        <form onSubmit={fetchWeather} className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="🔍  Search city (e.g. London, Mumbai, New York)..."
            className="flex-1 px-5 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/30"
          >
            {loading ? '⏳' : 'Search'}
          </button>
          <button
            type="button"
            onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition"
            title="Toggle °C / °F"
          >
            °{unit === 'C' ? 'F' : 'C'}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* ── Weather Card ── */}
        {weather && (
          <div className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 p-8 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-5xl">{emoji}</span>
                  <div>
                    <h2 className="text-4xl font-extrabold leading-tight">{val(weather.location?.name)}</h2>
                    <p className="text-gray-300 text-lg">
                      {val(weather.location?.region)}{weather.location?.region && weather.location?.country ? ', ' : ''}
                      {val(weather.location?.country)}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">🕐 {val(weather.location?.localtime)}</p>
              </div>
              <div className="text-right">
                <div className="text-7xl font-black text-blue-300 leading-none">
                  {toDisplay(weather.current?.temperature)}
                </div>
                <p className="text-xl text-gray-200 mt-2 font-medium">{val(desc)}</p>
                <p className="text-gray-400 text-sm mt-1">Feels like {toDisplay(weather.current?.feelslike)}</p>
                {weather.current?.weather_icons?.[0] && (
                  <img
                    src={weather.current.weather_icons[0]}
                    alt="icon"
                    className="w-16 h-16 mt-3 ml-auto rounded-full border-2 border-white/20 shadow"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-y divide-white/10">
              {[
                { label: '💧 Humidity',     value: `${val(weather.current?.humidity)}%` },
                { label: '💨 Wind',         value: `${val(weather.current?.wind_speed)} km/h ${val(weather.current?.wind_dir)}` },
                { label: '🌡️ Pressure',    value: `${val(weather.current?.pressure)} mb` },
                { label: '👁️ Visibility',  value: `${val(weather.current?.visibility)} km` },
                { label: '☁️ Cloud Cover', value: `${val(weather.current?.cloudcover)}%` },
                { label: '🔆 UV Index',    value: val(weather.current?.uv_index) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center justify-center p-5 hover:bg-white/5 transition">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-white font-bold text-lg">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Chart + Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Weather Trend
              <span className="ml-auto text-xs text-gray-400 font-normal">Last {Math.min(history.length, 10)} searches</span>
            </h3>
            <div className="h-64">
              {history.length > 0
                ? <Line data={chartData} options={chartOptions} />
                : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <span className="text-4xl mb-2">📊</span>
                    <p>Search a city to see trends</p>
                  </div>
                )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">📋 Search Summary</h3>
            {history.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Searches',  value: history.length,                                                                                icon: '🔍', color: 'text-blue-400' },
                  { label: 'Avg Temperature', value: `${Math.round(history.reduce((a, h) => a + (h.temperature || 0), 0) / history.length)}°C`,    icon: '🌡️', color: 'text-orange-400' },
                  { label: 'Avg Humidity',    value: `${Math.round(history.reduce((a, h) => a + (h.humidity || 0), 0) / history.length)}%`,        icon: '💧', color: 'text-cyan-400' },
                  { label: 'Cities Searched', value: new Set(history.map(h => h.city)).size,                                                       icon: '🌍', color: 'text-green-400' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-gray-400 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <span className="text-4xl mb-2">🌐</span>
                <p>No data yet — search a city!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Searches Table with Delete ── */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-bold">🕘 Recent Searches</h3>
              <p className="text-gray-400 text-sm mt-0.5">{history.length} record{history.length !== 1 ? 's' : ''} — click a row to re-search</p>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setConfirm({ type: 'all' })}
                disabled={clearingAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 hover:text-red-200 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50"
              >
                🗑️ {clearingAll ? 'Clearing…' : 'Clear All'}
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Temperature</th>
                    <th className="px-6 py-4">Condition</th>
                    <th className="px-6 py-4">Humidity</th>
                    <th className="px-6 py-4">Wind</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((h, i) => (
                    <tr
                      key={h._id}
                      className="hover:bg-white/5 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                      <td
                        className="px-6 py-4 font-semibold text-blue-300 cursor-pointer hover:text-blue-200 hover:underline"
                        onClick={() => { setCity(h.city); fetchWeather(null, h.city); }}
                        title="Click to search this city again"
                      >
                        {h.city}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{toDisplay(h.temperature)}</td>
                      <td className="px-6 py-4 text-gray-300">{getEmoji(h.condition)} {h.condition}</td>
                      <td className="px-6 py-4 text-cyan-400">{val(h.humidity)}%</td>
                      <td className="px-6 py-4 text-gray-300">{val(h.windSpeed)} km/h</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(h.searchedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setConfirm({ type: 'single', id: h._id })}
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <span className="text-5xl mb-3">🌤️</span>
              <p className="text-lg">No searches yet. Try searching for a city above!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
