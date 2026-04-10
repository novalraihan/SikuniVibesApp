import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Car, Settings, Users, DollarSign, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Jeep, Attraction } from '../../types';
import { getJeepById, createJeep, updateJeep } from '../../services/firebase/jeeps';
import { getAttractions } from '../../services/firebase/attractions';
import { toast } from 'sonner';

export function JeepForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [availableAttractions, setAvailableAttractions] = useState<Attraction[]>([]);

  const [formData, setFormData] = useState<Omit<Jeep, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    engine: '',
    capacity: 4,
    pricePerDay: 500000,
    images: [''],
    rules: [''],
    regulations: [''],
    attractionIds: [],
    isActive: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attractions = await getAttractions();
        setAvailableAttractions(attractions);

        if (id) {
          const data = await getJeepById(id);
          if (data) {
            const { id: _, createdAt: __, updatedAt: ___, ...rest } = data;
            setFormData({
              ...rest,
              attractionIds: rest.attractionIds || []
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error('Gagal memuat data');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await updateJeep(id, formData);
      } else {
        await createJeep(formData);
      }
      navigate('/admin/jeeps');
    } catch (error) {
      console.error("Error saving jeep:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (field: 'images' | 'rules' | 'regulations', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'images' | 'rules' | 'regulations') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'images' | 'rules' | 'regulations', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const toggleAttraction = (attractionId: string) => {
    setFormData(prev => ({
      ...prev,
      attractionIds: prev.attractionIds.includes(attractionId)
        ? prev.attractionIds.filter(id => id !== attractionId)
        : [...prev.attractionIds, attractionId]
    }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/admin/jeeps"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Car className="w-6 h-6" />
          {id ? 'Edit Jeep' : 'Tambah Jeep Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Informasi Dasar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Nama Jeep</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Jeep Wrangler Rubicon"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tipe Mesin</label>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="Contoh: 2.0L Turbo I4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Kapasitas Orang</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="number" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  placeholder="4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Harga Sewa / Hari</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="number" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData({ ...formData, pricePerDay: parseInt(e.target.value) })}
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Deskripsi</label>
            <textarea 
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan keunggulan dan kondisi jeep..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isActive"
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Aktifkan Jeep (Tampil di Publik)</label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Galeri Foto
            </h2>
            <button 
              type="button"
              onClick={() => addArrayItem('images')}
              className="text-sm font-bold text-blue-600 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Tambah Foto
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.images.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="url" 
                  required
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={url}
                  onChange={(e) => handleArrayChange('images', index, e.target.value)}
                  placeholder="URL Foto Jeep"
                />
                {formData.images.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeArrayItem('images', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rules & Regulations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rules */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Aturan Sewa
              </h2>
              <button 
                type="button"
                onClick={() => addArrayItem('rules')}
                className="text-sm font-bold text-blue-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={rule}
                    onChange={(e) => handleArrayChange('rules', index, e.target.value)}
                    placeholder="Contoh: Sudah termasuk Driver"
                  />
                  {formData.rules.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeArrayItem('rules', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Regulations */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Kebijakan
              </h2>
              <button 
                type="button"
                onClick={() => addArrayItem('regulations')}
                className="text-sm font-bold text-blue-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.regulations.map((reg, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={reg}
                    onChange={(e) => handleArrayChange('regulations', index, e.target.value)}
                    placeholder="Contoh: Dilarang merokok di dalam jeep"
                  />
                  {formData.regulations.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeArrayItem('regulations', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attractions Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Destinasi Wisata</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableAttractions.map(att => (
              <label key={att.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.attractionIds?.includes(att.id)}
                  onChange={() => toggleAttraction(att.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 pb-12">
          <button 
            type="button"
            onClick={() => navigate('/admin/jeeps')}
            className="px-6 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {id ? 'Perbarui Jeep' : 'Simpan Jeep'}
          </button>
        </div>
      </form>
    </div>
  );
}
