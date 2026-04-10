import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Home, MapPin } from 'lucide-react';
import { Property, Category } from '../../types';
import { getProperties, deleteProperty } from '../../services/firebase/properties';
import { getCategories } from '../../services/firebase/categories';

export function PropertiesList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsData, catsData] = await Promise.all([
        getProperties(),
        getCategories()
      ]);
      setProperties(propsData);
      setCategories(catsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategorySlug = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.slug : categoryId;
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      setDeletingId(id);
      await deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
      setDeletingId(null);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // Auto-cancel confirm after 3 seconds
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
        <h1 className="text-2xl font-bold text-gray-900">Kelola Properti</h1>
        <Link
          to="/admin/properties/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Tambah Properti
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Properti</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga/Malam</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada properti. Silakan tambah properti baru.
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {property.images[0] ? (
                          <img src={property.images[0]} alt={property.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Home className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{property.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            Maks. {property.maxGuests} Tamu
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{getCategorySlug(property.categoryId)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      Rp {property.basePrice.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        property.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/properties/${property.id}/edit`}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          disabled={deletingId === property.id}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDeleteId === property.id
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={confirmDeleteId === property.id ? "Klik lagi untuk hapus" : "Hapus"}
                        >
                          {deletingId === property.id ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
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
