import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import { getAddOn, createAddOn, updateAddOn } from '../../services/firebase/addons';
import { uploadImage } from '../../services/firebase/storage';
import { AddOnCategory } from '../../types';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

export function AddOnForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Other' as AddOnCategory,
    isActive: true,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      const fetchAddOn = async () => {
        try {
          const data = await getAddOn(id);
          if (data) {
            setFormData({
              name: data.name,
              description: data.description,
              price: data.price,
              category: data.category,
              isActive: data.isActive,
            });
            setExistingImages(data.images || []);
          } else {
            toast.error('Paket tambahan tidak ditemukan');
            navigate('/admin/addons');
          }
        } catch (error) {
          toast.error('Gagal memuat data paket tambahan');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchAddOn();
    }
  }, [isEdit, id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload new images
      const uploadedUrls = [];
      for (const file of newImages) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: false };
        const compressedFile = await imageCompression(file, options);
        const url = await uploadImage(compressedFile, 'addons');
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      const addOnData = { ...formData, images: finalImages };

      if (isEdit && id) {
        await updateAddOn(id, addOnData);
        toast.success('Paket tambahan berhasil diperbarui');
      } else {
        await createAddOn(addOnData);
        toast.success('Paket tambahan berhasil ditambahkan');
      }
      navigate('/admin/addons');
    } catch (error) {
      toast.error('Gagal menyimpan paket tambahan');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/addons')}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Paket Tambahan' : 'Tambah Paket Tambahan Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Contoh: Paket BBQ Premium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="BBQ">BBQ</option>
              <option value="Jeep">Jeep</option>
              <option value="Documentation">Dokumentasi</option>
              <option value="Rental">Rental</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
            <input
              type="number"
              name="price"
              required
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Jelaskan apa saja yang didapat dalam paket ini..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {formData.isActive ? 'Paket Aktif' : 'Paket Nonaktif'}
            </span>
          </label>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700">Gambar Paket</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt={`AddOn ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {newImages.map((file, index) => (
                <div key={`new-${index}`} className="relative group aspect-video rounded-lg overflow-hidden border border-indigo-200">
                  <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-indigo-600">
                <Upload className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium text-center px-2">Pilih Gambar</span>
                <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/addons')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            Simpan Paket
          </button>
        </div>
      </form>
    </div>
  );
}
