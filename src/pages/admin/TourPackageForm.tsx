import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Save, ArrowLeft, Plus } from 'lucide-react';
import { getTourPackage, createTourPackage, updateTourPackage } from '../../services/firebase/tourPackages';
import { getActiveProperties } from '../../services/firebase/properties';
import { getAttractions } from '../../services/firebase/attractions';
import { uploadImage } from '../../services/firebase/storage';
import { Property, Attraction } from '../../types';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

export function TourPackageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableAttractions, setAvailableAttractions] = useState<Attraction[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    duration: '',
    includedServices: [] as string[],
    propertyIds: [] as string[],
    attractionIds: [] as string[],
    isActive: true,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newService, setNewService] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeProps, attractions] = await Promise.all([
          getActiveProperties(),
          getAttractions()
        ]);
        setProperties(activeProps);
        setAvailableAttractions(attractions);

        if (isEdit && id) {
          const data = await getTourPackage(id);
          if (data) {
            setFormData({
              name: data.name,
              description: data.description,
              price: data.price,
              originalPrice: data.originalPrice || 0,
              duration: data.duration || '',
              includedServices: data.includedServices || [],
              propertyIds: data.propertyIds || [],
              attractionIds: data.attractionIds || [],
              isActive: data.isActive,
            });
            setExistingImages(data.images || []);
          } else {
            toast.error('Paket wisata tidak ditemukan');
            navigate('/admin/tour-packages');
          }
        }
      } catch (error) {
        toast.error('Gagal memuat data');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
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

  const addService = () => {
    if (newService.trim()) {
      setFormData(prev => ({
        ...prev,
        includedServices: [...prev.includedServices, newService.trim()]
      }));
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      includedServices: prev.includedServices.filter((_, i) => i !== index)
    }));
  };

  const toggleProperty = (propId: string) => {
    setFormData(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.includes(propId)
        ? prev.propertyIds.filter(p => p !== propId)
        : [...prev.propertyIds, propId]
    }));
  };

  const toggleAttraction = (attractionId: string) => {
    setFormData(prev => ({
      ...prev,
      attractionIds: prev.attractionIds.includes(attractionId)
        ? prev.attractionIds.filter(id => id !== attractionId)
        : [...prev.attractionIds, attractionId]
    }));
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
        const url = await uploadImage(compressedFile, 'tour-packages');
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      if (finalImages.length === 0) {
        throw new Error('Minimal 1 gambar harus diunggah');
      }

      const packageData = { ...formData, images: finalImages };

      if (isEdit && id) {
        await updateTourPackage(id, packageData);
        toast.success('Paket wisata berhasil diperbarui');
      } else {
        await createTourPackage(packageData);
        toast.success('Paket wisata berhasil ditambahkan');
      }
      navigate('/admin/tour-packages');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan paket wisata');
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
          onClick={() => navigate('/admin/tour-packages')}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Paket Wisata' : 'Tambah Paket Wisata Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: Paket Wisata Sikunir 2D1N"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Coret (Rp)</label>
              <input
                type="number"
                name="originalPrice"
                min="0"
                value={formData.originalPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Harga sebelum diskon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Akhir (Rp) *</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: 2 Hari 1 Malam"
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
                placeholder="Jelaskan detail paket wisata ini..."
              />
            </div>
          </div>
        </div>

        {/* Included Services */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Layanan Termasuk</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Contoh: Jeep Tour, Dokumentasi, Makan Siang"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
            />
            <button
              type="button"
              onClick={addService}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.includedServices.map((service, index) => (
              <span key={index} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                {service}
                <button type="button" onClick={() => removeService(index)} className="hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Linked Properties */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Pilih Penginapan (Opsional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {properties.map(prop => (
              <label key={prop.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.propertyIds.includes(prop.id)}
                  onChange={() => toggleProperty(prop.id)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">{prop.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Linked Attractions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Pilih Destinasi Wisata (Include)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableAttractions.map(att => (
              <label key={att.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attractionIds.includes(att.id)}
                  onChange={() => toggleAttraction(att.id)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">{att.name}</span>
              </label>
            ))}
            {availableAttractions.length === 0 && (
              <div className="col-span-full text-center py-4 text-gray-500 text-sm italic">
                Belum ada data wisata tersedia.
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Gambar Paket *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt={`Package ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-indigo-600">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Pilih Gambar</span>
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">{formData.isActive ? 'Paket Aktif' : 'Paket Nonaktif'}</span>
          </label>
        </div>

        <div className="pt-6 border-t flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admin/tour-packages')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Batal</button>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium disabled:opacity-70">
            {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="h-5 w-5" />}
            Simpan Paket
          </button>
        </div>
      </form>
    </div>
  );
}
