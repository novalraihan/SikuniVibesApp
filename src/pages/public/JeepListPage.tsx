import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { Jeep } from '../../types';
import { getJeeps } from '../../services/firebase/jeeps';
import { JeepCard } from '../../components/jeep/JeepCard';

export function JeepListPage() {
  const navigate = useNavigate();
  const [jeeps, setJeeps] = useState<Jeep[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchJeeps = async () => {
      try {
        const data = await getJeeps();
        setJeeps(data);
      } catch (error) {
        console.error("Error fetching jeeps:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJeeps();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 font-sans relative">
      {/* Header */}
      <div className={`sticky top-0 z-40 transition-all duration-300 px-4 py-3 flex items-center gap-3 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm' 
          : 'bg-white'
      }`}>
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-bold leading-tight text-gray-900">
            Sewa Jeep Dieng
          </h1>
          <p className="text-[13px] text-gray-500">
            {jeeps.length} jeep tersedia
          </p>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Filter className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Hero Banner */}
      <div className="px-5 sm:px-4 py-6 bg-blue-600 text-white mb-6">
        <h2 className="text-2xl font-bold mb-2">Jelajahi Dieng dengan Jeep</h2>
        <p className="text-blue-100 text-[14px]">Nikmati pengalaman tak terlupakan menjelajahi keindahan alam Dieng dengan armada jeep terbaik kami.</p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {jeeps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jeeps.map(jeep => (
              <JeepCard key={jeep.id} jeep={jeep} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Belum ada jeep</h2>
            <p className="text-[14px] text-gray-500">
              Belum ada jeep yang tersedia saat ini.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 max-w-5xl mx-auto">
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const message = `Halo, saya tertarik untuk menyewa Jeep di Dieng. Bisa minta informasi lebih lanjut?`;
              window.dispatchEvent(new CustomEvent('openChatbot', { detail: { message } }));
            }}
            className="flex-1 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 py-3"
          >
            Tanya Admin
          </button>
        </div>
      </div>
    </div>
  );
}
