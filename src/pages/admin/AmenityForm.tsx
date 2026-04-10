import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { getAmenity, createAmenity, updateAmenity } from '../../services/firebase/amenities';

const COMMON_ICONS = [
  'Wifi', 'Tv', 'Wind', 'Car', 'Coffee', 'Utensils', 'Bath', 'Bed', 'BedDouble', 'Snowflake', 
  'Flame', 'Waves', 'Monitor', 'Speaker', 'Dumbbell', 'Trees', 'Cigarette', 'CigaretteOff',
  'Briefcase', 'Baby', 'Dog', 'Shirt', 'Key', 'Shield', 'Video', 'MapPin', 'Home', 'Building',
  'ParkingCircle', 'Pool', 'UtensilsCrossed', 'Wine', 'CupSoda', 'Sofa', 'Fan', 'Heater'
];

export function AmenityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [iconSearch, setIconSearch] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: 'Wifi',
    isActive: true,
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchAmenity(id);
    }
  }, [isEdit, id]);

  const fetchAmenity = async (amenityId: string) => {
    try {
      const data = await getAmenity(amenityId);
      if (data) {
        setFormData({
          id: data.id,
          name: data.name,
          icon: data.icon || 'Wifi',
          isActive: data.isActive,
        });
      } else {
        setError('Fasilitas tidak ditemukan');
      }
    } catch (error) {
      console.error("Error fetching amenity:", error);
      setError('Gagal memuat data fasilitas');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        await updateAmenity(id, formData);
      } else {
        await createAmenity(formData);
      }
      navigate('/admin/amenities');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan fasilitas');
      setLoading(false);
    }
  };

  const filteredIcons = COMMON_ICONS.filter(icon => 
    icon.toLowerCase().includes(iconSearch.toLowerCase()) && 
    (Icons as any)[icon] !== undefined
  );

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
          onClick={() => navigate('/admin/amenities')}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Fasilitas' : 'Tambah Fasilitas Baru'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Fasilitas *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Contoh: WiFi Gratis"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Ikon</label>
          
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Cari ikon..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
            {filteredIcons.map(iconName => {
              const IconComponent = (Icons as any)[iconName];
              if (!IconComponent) return null;
              
              const isSelected = formData.icon === iconName;
              
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleIconSelect(iconName)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  title={iconName}
                >
                  <IconComponent className="h-6 w-6 mb-1" />
                  <span className="text-[9px] truncate w-full text-center">{iconName}</span>
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-full py-4 text-center text-sm text-gray-500">
                Ikon tidak ditemukan
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
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
              {formData.isActive ? 'Fasilitas Aktif' : 'Fasilitas Nonaktif'}
            </span>
          </label>
        </div>

        <div className="pt-6 border-t flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/amenities')}
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
            Simpan Fasilitas
          </button>
        </div>
      </form>
    </div>
  );
}
