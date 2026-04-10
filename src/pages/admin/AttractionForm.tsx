import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Save, ArrowLeft } from 'lucide-react';
import { getAttraction, createAttraction, updateAttraction } from '../../services/firebase/attractions';
import { uploadImage } from '../../services/firebase/storage';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

export function AttractionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    category: 'Alam',
    openingHours: '08:00 - 17:00',
    ticketPrice: 0,
    isActive: true,
  });

  const [facilities, setFacilities] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');
  const [newTip, setNewTip] = useState('');

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchAttractionData = async () => {
      if (isEdit && id) {
        try {
          const data = await getAttraction(id);
          if (data) {
            setFormData({
              name: data.name,
              description: data.description,
              location: data.location,
              category: data.category || 'Alam',
              openingHours: data.openingHours || '08:00 - 17:00',
              ticketPrice: data.ticketPrice || 0,
              isActive: data.isActive,
            });
            setFacilities(data.facilities || []);
            setTips(data.tips || []);
            setExistingImages(data.images || []);
          } else {
            toast.error('Wisata tidak ditemukan');
            navigate('/admin/attractions');
          }
        } catch (error) {
          toast.error('Gagal memuat data wisata');
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };
    fetchAttractionData();
  }, [isEdit, id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'ticketPrice') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addFacility = () => {
    if (newFacility.trim()) {
      setFacilities(prev => [...prev, newFacility.trim()]);
      setNewFacility('');
    }
  };

  const removeFacility = (index: number) => {
    setFacilities(prev => prev.filter((_, i) => i !== index));
  };

  const addTip = () => {
    if (newTip.trim()) {
      setTips(prev => [...prev, newTip.trim()]);
      setNewTip('');
    }
  };

  const removeTip = (index: number) => {
    setTips(prev => prev.filter((_, i) => i !== index));
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
      // 1. Upload new images
      const uploadedUrls = [];
      for (const file of newImages) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: false };
        const compressedFile = await imageCompression(file, options);
        const url = await uploadImage(compressedFile, 'attractions');
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      if (finalImages.length === 0) {
        throw new Error('Minimal 1 gambar harus diunggah');
      }

      const attractionData = { 
        ...formData, 
        images: finalImages,
        facilities,
        tips
      };

      if (isEdit && id) {
        await updateAttraction(id, { ...attractionData, updatedAt: Date.now() });
        toast.success('Wisata berhasil diperbarui');
      } else {
        await createAttraction(attractionData);
        toast.success('Wisata berhasil ditambahkan');
      }
      navigate('/admin/attractions');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan wisata');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/attractions')}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Wisata' : 'Tambah Wisata Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wisata *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: Kawah Sikidang"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Alam">Alam</option>
                <option value="Budaya">Budaya</option>
                <option value="Sejarah">Sejarah</option>
                <option value="Kuliner">Kuliner</option>
                <option value="Religi">Religi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Aktif (Tampilkan di publik)</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi *</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: Dieng Kulon, Banjarnegara"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Jelaskan detail wisata ini..."
              />
            </div>
          </div>
        </div>

        {/* Operational Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Operasional</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Buka</label>
              <input
                type="text"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: 08:00 - 17:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Tiket (Rp)</label>
              <input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: 15000"
              />
            </div>
          </div>
        </div>

        {/* Facilities & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Fasilitas</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Tambah fasilitas..."
              />
              <button
                type="button"
                onClick={addFacility}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Tambah
              </button>
            </div>
            <div className="space-y-2">
              {facilities.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-700">{f}</span>
                  <button type="button" onClick={() => removeFacility(i)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Tips Berkunjung</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Tambah tips..."
              />
              <button
                type="button"
                onClick={addTip}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Tambah
              </button>
            </div>
            <div className="space-y-2">
              {tips.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-700">{t}</span>
                  <button type="button" onClick={() => removeTip(i)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Gambar Wisata *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt={`Attraction ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {newImages.map((file, index) => (
              <div key={`new-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-indigo-200">
                <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all">
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-xs text-gray-500 mt-2">Tambah Gambar</span>
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/admin/attractions')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Simpan Wisata
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
