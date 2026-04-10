import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Car, Save } from 'lucide-react';
import { Jeep } from '../../types';
import { getJeeps, deleteJeep } from '../../services/firebase/jeeps';
import { ImageUpload } from '../../components/common/ImageUpload';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

export function JeepsList() {
  const [jeeps, setJeeps] = useState<Jeep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jeepCategoryIconUrl, setJeepCategoryIconUrl] = useState('');
  const [savingIcon, setSavingIcon] = useState(false);

  useEffect(() => {
    fetchJeeps();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const settings = await getSiteSettings();
    if (settings?.jeepCategoryIconUrl) {
      setJeepCategoryIconUrl(settings.jeepCategoryIconUrl);
    }
  };

  const saveJeepIcon = async () => {
    setSavingIcon(true);
    try {
      const settingsRef = doc(db, 'settings/general');
      await setDoc(settingsRef, { jeepCategoryIconUrl }, { merge: true });
      toast.success('Icon kategori Jeep berhasil disimpan');
    } catch (error) {
      console.error('Error saving jeep icon:', error);
      toast.error('Gagal menyimpan icon kategori Jeep');
    } finally {
      setSavingIcon(false);
    }
  };

  const fetchJeeps = async () => {
    try {
      const data = await getJeeps(false); // Fetch all, including inactive
      setJeeps(data);
    } catch (error) {
      console.error("Error fetching jeeps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jeep ini?')) {
      try {
        await deleteJeep(id);
        setJeeps(jeeps.filter(j => j.id !== id));
      } catch (error) {
        console.error("Error deleting jeep:", error);
      }
    }
  };

  const filteredJeeps = jeeps.filter(j => 
    j.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Car className="w-6 h-6" />
          Kelola Jeep
        </h1>
        <Link 
          to="/admin/jeeps/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Jeep
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Icon Kategori Jeep (Halaman Utama)</h2>
        <p className="text-sm text-gray-500 mb-4">Unggah icon untuk menggantikan icon mobil bawaan pada kategori Jeep di halaman utama.</p>
        <div className="max-w-xs mb-4">
          <ImageUpload
            value={jeepCategoryIconUrl || ''}
            onChange={(url) => setJeepCategoryIconUrl(url)}
            path="categories"
          />
        </div>
        <button
          onClick={saveJeepIcon}
          disabled={savingIcon}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {savingIcon ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Icon
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari jeep..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Jeep</th>
                <th className="px-6 py-4">Mesin</th>
                <th className="px-6 py-4">Kapasitas</th>
                <th className="px-6 py-4">Harga / Hari</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJeeps.map((jeep) => (
                <tr key={jeep.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={jeep.images[0] || 'https://picsum.photos/seed/jeep/100/100'} 
                          alt={jeep.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-medium text-gray-900">{jeep.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{jeep.engine}</td>
                  <td className="px-6 py-4 text-gray-600">{jeep.capacity} Orang</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">
                    Rp {jeep.pricePerDay.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      jeep.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {jeep.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        to={`/admin/jeeps/${jeep.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(jeep.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
