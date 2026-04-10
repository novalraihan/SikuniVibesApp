import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Save, ArrowLeft, Plus, Trash2, Edit2, MessageSquare, Star } from 'lucide-react';
import { getProperty, createProperty, updateProperty } from '../../services/firebase/properties';
import { getCategories } from '../../services/firebase/categories';
import { getAllAmenities } from '../../services/firebase/amenities';
import { uploadImage } from '../../services/firebase/storage';
import { getPropertyReviews, updateReview, deleteReview, createReview, Review } from '../../services/firebase/reviews';
import { getAttractions } from '../../services/firebase/attractions';
import { Category, Amenity, PropertyUnit, Attraction, NearbyAttraction } from '../../types';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

export function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [availableAttractions, setAvailableAttractions] = useState<Attraction[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    basePrice: 0,
    affiliateCommission: 0,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    isActive: true,
    amenities: [] as string[],
    location: '',
    accommodationRules: '',
    lat: 0,
    lng: 0,
    badgeLabel: '',
    units: [] as PropertyUnit[],
    nearbyAttractions: [] as NearbyAttraction[],
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', userName: '' });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cats, amens, atts] = await Promise.all([
          getCategories(),
          getAllAmenities(),
          getAttractions(true)
        ]);
        
        setCategories(cats.filter(c => c.isActive));
        setAvailableAmenities(amens.filter(a => a.isActive));
        setAvailableAttractions(atts);

        if (cats.length > 0 && !isEdit) {
          setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
        }

        if (isEdit && id) {
          const [data, propertyReviews] = await Promise.all([
            getProperty(id),
            getPropertyReviews(id)
          ]);
          
          if (data) {
            setFormData({
              name: data.name,
              categoryId: data.categoryId,
              description: data.description,
              basePrice: data.basePrice,
              affiliateCommission: data.affiliateCommission || 0,
              maxGuests: data.maxGuests,
              bedrooms: data.bedrooms || 1,
              bathrooms: data.bathrooms || 1,
              isActive: data.isActive,
              amenities: data.amenities || [],
              location: data.location || '',
              accommodationRules: data.accommodationRules || '',
              lat: data.coordinates?.lat || 0,
              lng: data.coordinates?.lng || 0,
              badgeLabel: data.badgeLabel || '',
              units: data.units || [],
              nearbyAttractions: data.nearbyAttractions || [],
            });
            setExistingImages(data.images || []);
            setReviews(propertyReviews);
          } else {
            setError('Properti tidak ditemukan');
          }
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError('Gagal memuat data awal');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [isEdit, id]);

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

  const handleAmenityToggle = (amenityName: string) => {
    setFormData(prev => {
      const currentAmenities = prev.amenities;
      if (currentAmenities.includes(amenityName)) {
        return { ...prev, amenities: currentAmenities.filter(a => a !== amenityName) };
      } else {
        return { ...prev, amenities: [...currentAmenities, amenityName] };
      }
    });
  };

  const addUnit = () => {
    const newUnit: PropertyUnit = {
      id: `UNIT-${Date.now()}`,
      name: `Unit ${formData.units.length + 1}`,
      description: '',
      price: 0,
      capacity: 2,
      isActive: true
    };
    setFormData(prev => ({ ...prev, units: [...prev.units, newUnit] }));
  };

  const removeUnit = (unitId: string) => {
    setFormData(prev => ({ ...prev, units: prev.units.filter(u => u.id !== unitId) }));
  };

  const updateUnit = (unitId: string, field: keyof PropertyUnit, value: any) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map(u => u.id === unitId ? { ...u, [field]: value } : u)
    }));
  };

  const toggleUnitStatus = (unitId: string) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map(u => u.id === unitId ? { ...u, isActive: !u.isActive } : u)
    }));
  };

  const addNearbyAttraction = () => {
    if (availableAttractions.length === 0) return;
    const newNearby: NearbyAttraction = {
      attractionId: availableAttractions[0].id,
      distance: 0
    };
    setFormData(prev => ({ ...prev, nearbyAttractions: [...prev.nearbyAttractions, newNearby] }));
  };

  const removeNearbyAttraction = (index: number) => {
    setFormData(prev => ({ ...prev, nearbyAttractions: prev.nearbyAttractions.filter((_, i) => i !== index) }));
  };

  const updateNearbyAttraction = (index: number, field: keyof NearbyAttraction, value: any) => {
    setFormData(prev => ({
      ...prev,
      nearbyAttractions: prev.nearbyAttractions.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!id || !window.confirm('Hapus review ini?')) return;
    try {
      await deleteReview(reviewId, id);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review berhasil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus review');
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsAddingReview(false);
    setReviewForm({ rating: review.rating, comment: review.comment, userName: review.userName });
  };

  const handleUpdateReview = async () => {
    if (!id || !editingReview) return;
    try {
      await updateReview(editingReview.id, id, { rating: reviewForm.rating, comment: reviewForm.comment });
      setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, rating: reviewForm.rating, comment: reviewForm.comment } : r));
      setEditingReview(null);
      toast.success('Review berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui review');
    }
  };

  const handleCreateReview = async () => {
    if (!id || !reviewForm.userName || !reviewForm.comment) {
      toast.error('Nama dan komentar harus diisi');
      return;
    }
    try {
      const newReviewData = {
        propertyId: id,
        userId: 'admin-created',
        userName: reviewForm.userName,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      };
      await createReview(newReviewData);
      // Refresh reviews
      const propertyReviews = await getPropertyReviews(id);
      setReviews(propertyReviews);
      setIsAddingReview(false);
      setReviewForm({ rating: 5, comment: '', userName: '' });
      toast.success('Review berhasil ditambahkan');
    } catch (err) {
      toast.error('Gagal menambahkan review');
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
    setError('');

    try {
      if (!formData.categoryId) {
        throw new Error('Kategori harus dipilih');
      }

      // 1. Upload new images
      const uploadedUrls: string[] = [];
      for (const file of newImages) {
        // Compress image
        const options = {
          maxSizeMB: 1, // Compress to max 1MB
          maxWidthOrHeight: 1920,
          useWebWorker: false,
        };
        const compressedFile = await imageCompression(file, options);
        
        const path = `properties`;
        const url = await uploadImage(compressedFile, path);
        uploadedUrls.push(url);
      }

      // 2. Combine images
      const finalImages = [...existingImages, ...uploadedUrls];

      if (finalImages.length === 0) {
        throw new Error('Minimal 1 gambar properti harus diunggah.');
      }

      // 3. Prepare data
      const propertyData = {
        name: formData.name,
        categoryId: formData.categoryId,
        description: formData.description,
        basePrice: formData.basePrice,
        affiliateCommission: formData.affiliateCommission,
        maxGuests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        isActive: formData.isActive,
        amenities: formData.amenities,
        images: finalImages,
        location: formData.location,
        accommodationRules: formData.accommodationRules,
        badgeLabel: formData.badgeLabel,
        units: formData.units,
        nearbyAttractions: formData.nearbyAttractions,
        coordinates: {
          lat: formData.lat,
          lng: formData.lng
        }
      };

      // 4. Save to Firestore
      if (isEdit && id) {
        await updateProperty(id, propertyData);
        toast.success('Properti berhasil diperbarui');
      } else {
        await createProperty(propertyData);
        toast.success('Properti berhasil ditambahkan');
      }

      // 5. Redirect
      navigate('/admin/properties');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan properti');
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
          onClick={() => navigate('/admin/properties')}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Properti' : 'Tambah Properti Baru'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Properti *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: Villa Sikunir Indah"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
              <select
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Label Badge (Opsional)</label>
              <input
                type="text"
                name="badgeLabel"
                value={formData.badgeLabel}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: Trend, Rekomendasi, Diskon"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Jelaskan keunggulan properti ini..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Peraturan Akomodasi</label>
              <textarea
                name="accommodationRules"
                rows={3}
                value={formData.accommodationRules}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: Dilarang merokok, Tidak boleh membawa hewan peliharaan..."
              />
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Lokasi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap / Lokasi</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: Jl. Dieng Km 14, Wonosobo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                name="lat"
                step="any"
                value={formData.lat}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: -7.2052"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                name="lng"
                step="any"
                value={formData.lng}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: 109.9038"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Capacity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Harga & Kapasitas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Malam (Rp) *</label>
              <input
                type="number"
                name="basePrice"
                required
                min="0"
                value={formData.basePrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Komisi Affiliate (Rp)</label>
              <input
                type="number"
                name="affiliateCommission"
                min="0"
                value={formData.affiliateCommission}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: 50000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Tamu *</label>
              <input
                type="number"
                name="maxGuests"
                required
                min="1"
                value={formData.maxGuests}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Kamar Tidur *</label>
              <input
                type="number"
                name="bedrooms"
                required
                min="1"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Kamar Mandi *</label>
              <input
                type="number"
                name="bathrooms"
                required
                min="1"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Fasilitas</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {availableAmenities.map(amenity => (
              <label key={amenity.id} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.name)}
                  onChange={() => handleAmenityToggle(amenity.name)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
              </label>
            ))}
            {availableAmenities.length === 0 && (
              <div className="col-span-full text-sm text-gray-500">
                Belum ada fasilitas yang tersedia. Silakan tambahkan fasilitas di menu Kelola Fasilitas.
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Gambar Properti *</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing Images */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt={`Property ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* New Images Preview */}
            {newImages.map((file, index) => (
              <div key={`new-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-indigo-200">
                <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-indigo-500/10"></div>
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-indigo-600">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Pilih Gambar</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">Format yang didukung: JPG, PNG. Maksimal 5MB per file.</p>
        </div>

        {/* Units Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Pengaturan Unit</h2>
            <button
              type="button"
              onClick={addUnit}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Unit
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.units.map((unit) => (
              <div key={unit.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Unit</label>
                    <input
                      type="text"
                      value={unit.name}
                      onChange={(e) => updateUnit(unit.id, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Nama Unit (cth: Kamar 101)"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      value={unit.price || 0}
                      onChange={(e) => updateUnit(unit.id, 'price', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kapasitas</label>
                    <input
                      type="number"
                      value={unit.capacity || 2}
                      onChange={(e) => updateUnit(unit.id, 'capacity', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-4 self-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unit.isActive}
                        onChange={() => toggleUnitStatus(unit.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">Aktif</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeUnit(unit.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Deskripsi Unit</label>
                  <textarea
                    value={unit.description || ''}
                    onChange={(e) => updateUnit(unit.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Jelaskan detail unit ini (opsional)..."
                  />
                </div>
              </div>
            ))}
            {formData.units.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                Belum ada unit. Klik "Tambah Unit" untuk menambahkan.
              </div>
            )}
          </div>
        </div>

        {/* Nearby Attractions Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Wisata Terdekat</h2>
            <button
              type="button"
              onClick={addNearbyAttraction}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Wisata
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.nearbyAttractions.map((nearby, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <select
                    value={nearby.attractionId}
                    onChange={(e) => updateNearbyAttraction(index, 'attractionId', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {availableAttractions.map(att => (
                      <option key={att.id} value={att.id}>{att.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={nearby.distance}
                      onChange={(e) => updateNearbyAttraction(index, 'distance', Number(e.target.value))}
                      className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Jarak"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">km</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeNearbyAttraction(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.nearbyAttractions.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                Belum ada wisata terdekat. Klik "Tambah Wisata" untuk menambahkan.
              </div>
            )}
          </div>
        </div>

        {/* Reviews Management (Only for Edit) */}
        {isEdit && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Kelola Review</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingReview(null);
                  setReviewForm({ rating: 5, comment: '', userName: '' });
                  setIsAddingReview(true);
                }}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Tambah Review
              </button>
            </div>
            
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="font-medium text-gray-900">{review.userName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditReview(review)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                  Belum ada review untuk properti ini.
                </div>
              )}
            </div>

            {/* Edit/Add Review Modal/Overlay */}
            {(editingReview || isAddingReview) && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{isAddingReview ? 'Tambah Review' : 'Edit Review'}</h3>
                    <button onClick={() => {
                      setEditingReview(null);
                      setIsAddingReview(false);
                    }}><X className="h-5 w-5" /></button>
                  </div>
                  
                  <div className="space-y-4">
                    {isAddingReview && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Reviewer *</label>
                        <input
                          type="text"
                          value={reviewForm.userName}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, userName: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Nama pengunjung"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className={`p-1 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            <Star className={`h-8 w-8 ${star <= reviewForm.rating ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Komentar *</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Tulis komentar..."
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={isAddingReview ? handleCreateReview : handleUpdateReview}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700"
                    >
                      {isAddingReview ? 'Tambah Review' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Status</h2>
          
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
              {formData.isActive ? 'Properti Aktif (Bisa dibooking)' : 'Properti Nonaktif (Disembunyikan)'}
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/properties')}
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
            Simpan Properti
          </button>
        </div>
      </form>
    </div>
  );
}
