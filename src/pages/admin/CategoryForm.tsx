import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Category } from '../../types';
import { createCategory, getCategory, updateCategory } from '../../services/firebase/categories';
import { ImageUpload } from '../../components/common/ImageUpload';
import { toast } from 'sonner';

export function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    slug: '',
    iconUrl: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEdit && id) {
      getCategory(id)
        .then((data) => {
          if (data) {
            setFormData({
              name: data.name,
              slug: data.slug,
              iconUrl: data.iconUrl || '',
              imageUrl: data.imageUrl || '',
              isActive: data.isActive,
            });
          }
        })
        .catch(error => {
          console.error("Error fetching category:", error);
          setError("Gagal memuat data kategori");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEdit && id) {
        await updateCategory(id, formData);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await createCategory(formData);
        toast.success('Kategori berhasil ditambahkan');
      }
      navigate('/admin/categories');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan kategori.');
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50"
            />
          </div>

          <div>
            <ImageUpload
              value={formData.iconUrl || ''}
              onChange={(url) => setFormData((prev) => ({ ...prev, iconUrl: url }))}
              path="categories/icons"
              label="Icon Kategori (Untuk Halaman Utama)"
            />
          </div>

          <div>
            <ImageUpload
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              path="categories"
              label="Banner Kategori (Untuk Halaman Kategori)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Kategori Aktif
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
          </button>
        </div>
      </form>
    </div>
  );
}
