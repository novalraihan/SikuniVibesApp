import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { updateUserOnboarding } from '../services/firebase/users';
import { getAttractions } from '../services/firebase/attractions';
import { Attraction } from '../types';
import { toast } from 'sonner';

export function OnboardingModal() {
  const { user, setUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    source: '',
    knownAttractions: [] as string[],
    visitCount: '',
    expectations: ''
  });

  useEffect(() => {
    // Show modal if user is logged in and hasn't completed onboarding
    if (user && user.onboardingCompleted === undefined) {
      setIsOpen(true);
      fetchAttractions();
    }
  }, [user]);

  const fetchAttractions = async () => {
    try {
      const data = await getAttractions(true);
      setAttractions(data);
    } catch (error) {
      console.error('Error fetching attractions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttractionToggle = (attractionName: string) => {
    setFormData(prev => {
      const current = prev.knownAttractions;
      if (current.includes(attractionName)) {
        return { ...prev, knownAttractions: current.filter(a => a !== attractionName) };
      } else {
        return { ...prev, knownAttractions: [...current, attractionName] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateUserOnboarding(user.uid, formData);
      // Update local state so modal doesn't show again
      setUser({ ...user, onboardingCompleted: true, onboardingData: formData });
      setIsOpen(false);
      toast.success('Terima kasih telah melengkapi profil Anda!');
    } catch (error) {
      toast.error('Gagal menyimpan data');
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    try {
      // Mark as completed even if skipped, so it doesn't bother them again
      await updateUserOnboarding(user.uid, {});
      setUser({ ...user, onboardingCompleted: true });
      setIsOpen(false);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] overflow-y-auto p-4 flex justify-center items-start sm:items-center">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 sm:my-auto relative">
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang di Sikunir Vibes! 🎉</h2>
            <p className="text-gray-600">
              Bantu kami memberikan pengalaman terbaik dengan melengkapi sedikit informasi tentang Anda. (Opsional)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Contoh: 08123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kota Asal</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Contoh: Jakarta"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahu Sikunir Vibes dari mana?</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Pilih salah satu...</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="google">Pencarian Google</option>
                <option value="teman">Rekomendasi Teman/Keluarga</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wisata Dieng apa saja yang Anda ketahui?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attractions.map(attraction => (
                  <label key={attraction.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.knownAttractions.includes(attraction.name)}
                      onChange={() => handleAttractionToggle(attraction.name)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 line-clamp-1">{attraction.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Berapa kali ke Wonosobo/Dieng?</label>
                <select
                  name="visitCount"
                  value={formData.visitCount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="">Pilih...</option>
                  <option value="0">Belum pernah (Ini yang pertama)</option>
                  <option value="1-2">1 - 2 kali</option>
                  <option value="3-5">3 - 5 kali</option>
                  <option value=">5">Lebih dari 5 kali</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apa harapan Anda liburan ke Dieng?</label>
              <textarea
                name="expectations"
                value={formData.expectations}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Contoh: Ingin melihat sunrise, mencari ketenangan, kulineran..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Lewati
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Simpan Profil
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
