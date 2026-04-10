import { useState, useEffect } from 'react';
import { Shield, User as UserIcon, Trash2, CheckCircle, XCircle, Eye, Calendar, Phone, Mail, MapPin, Clock, Info, X } from 'lucide-react';
import { getAllUsers, updateUserRole, deleteUser } from '../../services/firebase/users';
import { User, Role } from '../../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data pengguna');
      setError(err.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id: string, newRole: Role) => {
    if (window.confirm(`Apakah Anda yakin ingin mengubah peran pengguna ini menjadi ${newRole}?`)) {
      try {
        await updateUserRole(id, newRole);
        setUsers(users.map(u => u.uid === id ? { ...u, role: newRole } : u));
        toast.success(`Peran pengguna berhasil diubah menjadi ${newRole}`);
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengubah peran pengguna');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u.uid !== id));
        toast.success('Pengguna berhasil dihapus');
      } catch (err: any) {
        toast.error(err.message || 'Gagal menghapus pengguna');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Detail Pengguna</h2>
                    <p className="text-indigo-100 text-xs">Informasi lengkap profil pengguna</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt={selectedUser.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                        {selectedUser.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedUser.displayName || 'Tanpa Nama'}</h3>
                    <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
                      <Mail className="w-4 h-4" /> {selectedUser.email}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedUser.role === 'super_admin' ? 'bg-red-100 text-red-700' : 
                        selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                        selectedUser.role === 'resepsionis' ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedUser.role}
                      </span>
                      {selectedUser.isAffiliate && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          Affiliate
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Informasi Kontak</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Nomor Telepon</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUser.phoneNumber || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Alamat</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUser.address || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Statistik & Akun</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Terdaftar Pada</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            }) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Terakhir Update</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            }) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding / Survey Data */}
                {selectedUser.onboardingData && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Data Survey / Onboarding</h4>
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                      {Object.entries(selectedUser.onboardingData).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <p className="text-xs font-bold text-gray-500">{key}</p>
                          <p className="text-sm text-gray-900 bg-white p-3 rounded-xl border border-gray-100">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliate Info */}
                {selectedUser.isAffiliate && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Informasi Affiliate</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase">Kode Affiliate</p>
                        <p className="text-lg font-bold text-indigo-700">{selectedUser.affiliateCode}</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase">Total Klik</p>
                        <p className="text-lg font-bold text-indigo-700">{selectedUser.affiliateClicks || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Pengguna</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Email</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Peran</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Terdaftar</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <UserIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.displayName || 'Tanpa Nama'}</p>
                          <p className="text-xs text-gray-500">{user.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${
                          user.role === 'super_admin' ? 'bg-red-100 text-red-800' : 
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'resepsionis' ? 'bg-orange-100 text-orange-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="resepsionis">Resepsionis</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.uid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
