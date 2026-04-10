import React, { useState, useEffect } from 'react';
import { getLogs, LogEntry } from '../../services/firebase/logs';
import { Clock, Filter, Search, Activity, User, ShoppingBag, DollarSign, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await getLogs(200); // Fetch up to 200 logs
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Gagal memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter;
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking': return <ShoppingBag className="w-5 h-5 text-indigo-600" />;
      case 'user': return <User className="w-5 h-5 text-green-600" />;
      case 'affiliate': return <DollarSign className="w-5 h-5 text-yellow-600" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-600" />;
      default: return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Log Aktivitas
        </h1>
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Semua Tipe</option>
            <option value="booking">Booking</option>
            <option value="user">User</option>
            <option value="affiliate">Affiliate</option>
            <option value="system">Sistem</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada log aktivitas yang ditemukan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getIconForType(log.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{log.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.date).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      {log.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
