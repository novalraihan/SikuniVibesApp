import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Category } from '../../types';
import { getCategories, deleteCategory } from '../../services/firebase/categories';

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      setDeletingId(id);
      try {
        await deleteCategory(id);
        setCategories(categories.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting category:", error);
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
        <h1 className="text-2xl font-bold text-gray-900">Kelola Kategori</h1>
        <Link
          to="/admin/categories/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Tambah Kategori
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Icon & Banner</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Nama</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Slug</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex gap-2">
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt="icon" className="w-12 h-12 rounded object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                          <Tag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt="banner" className="w-20 h-12 rounded object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                          <span className="text-[10px] text-gray-400">No Banner</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900">{category.name}</td>
                    <td className="p-4 text-gray-600">{category.slug}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/categories/${category.id}/edit`}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDeleteId === category.id
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={confirmDeleteId === category.id ? "Klik lagi untuk hapus" : "Hapus"}
                        >
                          {deletingId === category.id ? (
                            <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
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
