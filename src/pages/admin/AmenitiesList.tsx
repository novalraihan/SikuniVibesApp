import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { getAllAmenities, deleteAmenity } from '../../services/firebase/amenities';
import { Amenity } from '../../types';

export function AmenitiesList() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const data = await getAllAmenities();
      setAmenities(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data fasilitas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      setDeletingId(id);
      try {
        await deleteAmenity(id);
        setAmenities(amenities.filter(a => a.id !== id));
      } catch (err: any) {
        setError(err.message || 'Gagal menghapus fasilitas');
      } finally {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
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
        <h1 className="text-2xl font-bold text-gray-900">Kelola Fasilitas</h1>
        <Link
          to="/admin/amenities/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Tambah Fasilitas
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Nama Fasilitas</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Ikon</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {amenities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Belum ada data fasilitas.
                  </td>
                </tr>
              ) : (
                amenities.map((amenity) => (
                  <tr key={amenity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">{amenity.name}</td>
                    <td className="p-4 text-sm text-gray-500">{amenity.icon || '-'}</td>
                    <td className="p-4">
                      {amenity.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/amenities/${amenity.id}/edit`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(amenity.id)}
                          disabled={deletingId === amenity.id}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                            confirmDeleteId === amenity.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={confirmDeleteId === amenity.id ? "Klik lagi untuk menghapus" : "Hapus"}
                        >
                          {deletingId === amenity.id ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              {confirmDeleteId === amenity.id && <span className="text-xs font-medium">Yakin?</span>}
                            </>
                          )}
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
