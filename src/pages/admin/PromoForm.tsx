import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Promo, Property } from '../../types';
import { createPromo, getPromo, updatePromo } from '../../services/firebase/promos';
import { getProperties } from '../../services/firebase/properties';
import { ImageUpload } from '../../components/common/ImageUpload';

export function PromoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);

  const [formData, setFormData] = useState<Omit<Promo, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    code: '',
    discountAmount: 0,
    discountType: 'percentage',
    imageUrl: '',
    labelUrl: '',
    startDate: Date.now(),
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
    isActive: true,
    isHidden: false,
    maxUsage: 0,
    currentUsage: 0,
    applicableProperties: [],
  });

  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const props = await getProperties();
        setProperties(props);

        if (isEdit && id) {
          const data = await getPromo(id);
          if (data) {
            setFormData({
              title: data.title,
              description: data.description,
              code: data.code,
              discountAmount: data.discountAmount,
              discountType: data.discountType,
              imageUrl: data.imageUrl || '',
              labelUrl: data.labelUrl || '',
              startDate: data.startDate,
              endDate: data.endDate,
              isActive: data.isActive,
              isHidden: data.isHidden || false,
              maxUsage: data.maxUsage || 0,
              currentUsage: data.currentUsage || 0,
              applicableProperties: data.applicableProperties || [],
            });
            setIsUnlimited(data.maxUsage === 0);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = Number(value);
    } else if (type === 'date') {
      const date = new Date(value);
      if (name === 'endDate') {
        // Set to end of day (23:59:59.999)
        date.setHours(23, 59, 59, 999);
      }
      parsedValue = date.getTime();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handlePropertyToggle = (propertyId: string) => {
    setFormData(prev => {
      const current = prev.applicableProperties || [];
      if (current.includes(propertyId)) {
        return { ...prev, applicableProperties: current.filter(id => id !== propertyId) };
      } else {
        return { ...prev, applicableProperties: [...current, propertyId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Ensure endDate is at the end of the day
      const finalEndDate = new Date(formData.endDate);
      finalEndDate.setHours(23, 59, 59, 999);
      
      const finalData = {
        ...formData,
        endDate: finalEndDate.getTime()
      };

      if (isEdit && id) {
        await updatePromo(id, finalData);
      } else {
        await createPromo(finalData);
      }
      navigate('/admin/promos');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan promo.');
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

  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Promo' : 'Tambah Promo Baru'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Promo</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Promo</label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Diskon</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="flat">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Diskon</label>
              <input
                type="number"
                name="discountAmount"
                required
                min="0"
                value={formData.discountAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Maksimal Penggunaan</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isUnlimited"
                    checked={isUnlimited}
                    onChange={(e) => {
                      setIsUnlimited(e.target.checked);
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, maxUsage: 0 }));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isUnlimited" className="text-sm text-gray-600">Tanpa Batas</label>
                </div>
              </div>
              <input
                type="number"
                name="maxUsage"
                min="0"
                disabled={isUnlimited}
                value={isUnlimited ? '' : (formData.maxUsage || '')}
                onChange={handleChange}
                placeholder={isUnlimited ? "Tanpa Batas" : "Masukkan kuota"}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                name="startDate"
                required
                value={formatDateForInput(formData.startDate)}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berakhir</label>
              <input
                type="date"
                name="endDate"
                required
                value={formatDateForInput(formData.endDate)}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <ImageUpload
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              path="promos"
              label="Banner Promo"
            />
          </div>

          <div>
            <ImageUpload
              value={formData.labelUrl || ''}
              onChange={(url) => setFormData((prev) => ({ ...prev, labelUrl: url }))}
              path="promos/labels"
              label="Label Promo (Ditampilkan di Card Properti)"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
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
                Promo Aktif
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHidden"
                name="isHidden"
                checked={formData.isHidden}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isHidden" className="text-sm font-medium text-gray-700">
                Sembunyikan Promo (Hanya bisa dipakai dengan kode)
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berlaku untuk Properti (Kosongkan jika berlaku untuk semua)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50">
              {properties.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2">Belum ada properti.</p>
              ) : (
                properties.map(property => (
                  <label key={property.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={(formData.applicableProperties || []).includes(property.id)}
                      onChange={() => handlePropertyToggle(property.id)}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{property.name}</p>
                      <p className="text-xs text-gray-500">ID: {property.id.slice(0, 8)}...</p>
                    </div>
                  </label>
                ))
              )}
            </div>
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
            {submitting ? 'Menyimpan...' : 'Simpan Promo'}
          </button>
        </div>
      </form>
    </div>
  );
}
