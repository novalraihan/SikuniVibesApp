import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, Settings, Users, ShieldCheck, Info, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Jeep } from '../../types';
import { getJeepById } from '../../services/firebase/jeeps';

export function JeepDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jeep, setJeep] = useState<Jeep | null>(null);
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
    const fetchJeep = async () => {
      if (id) {
        try {
          const data = await getJeepById(id);
          setJeep(data);
        } catch (error) {
          console.error("Error fetching jeep details:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchJeep();
  }, [id]);

  const handleRentNow = () => {
    if (jeep) {
      const message = `Halo, saya tertarik untuk menyewa Jeep: ${jeep.name}. Bisa minta informasi lebih lanjut?`;
      window.dispatchEvent(new CustomEvent('openChatbot', { detail: { message } }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!jeep) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Jeep tidak ditemukan</h2>
        <button 
          onClick={() => navigate('/jeeps')}
          className="text-blue-600 font-semibold"
        >
          Kembali ke daftar jeep
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-32 font-sans relative">
      {/* Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3 flex items-center justify-between ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}>
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            scrolled ? 'bg-gray-100' : 'bg-black/20 text-white'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            scrolled ? 'bg-gray-100' : 'bg-black/20 text-white'
          }`}>
            <Share2 className="w-5 h-5" />
          </button>
          <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            scrolled ? 'bg-gray-100' : 'bg-black/20 text-white'
          }`}>
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden">
        <img 
          src={jeep.images[0] || 'https://picsum.photos/seed/jeep/1200/800'} 
          alt={jeep.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[12px] font-medium">
          1 / {jeep.images.length} Foto
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-0 sm:p-4 -mt-6 bg-white rounded-t-[30px] relative z-10">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-start mb-4 px-4 sm:px-0">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 leading-tight mb-1">{jeep.name}</h1>
            <p className="text-[14px] text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Tersedia & Siap Jalan
            </p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold text-blue-600">Rp {jeep.pricePerDay.toLocaleString('id-ID')}</p>
            <p className="text-[12px] text-gray-500">per hari</p>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8 px-4 sm:px-0">
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Mesin</p>
              <p className="text-[13px] font-bold text-gray-900">{jeep.engine}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Kapasitas</p>
              <p className="text-[13px] font-bold text-gray-900">{jeep.capacity} Orang</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 px-4 sm:px-0">
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">Deskripsi</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            {jeep.description}
          </p>
        </div>

        {/* Rules & Regulations */}
        <div className="space-y-6 mb-8 px-4 sm:px-0">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Aturan Sewa
            </h2>
            <ul className="space-y-2">
              {jeep.rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-[14px] text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0"></span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Peraturan & Kebijakan
            </h2>
            <ul className="space-y-2">
              {jeep.regulations.map((reg, index) => (
                <li key={index} className="flex items-start gap-2 text-[14px] text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0"></span>
                  {reg}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-6 inset-x-0 flex flex-col items-center z-50 px-6 animate-[slideUp_0.4s_ease-out_forwards]">
        <div className="w-full max-w-[342px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-4 py-2 flex items-center justify-between rounded-full">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0 mr-3"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <div className="leading-[1.2] pl-2 flex-1 border-l border-gray-100">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">Harga Sewa</div>
            <div className="text-[16px] font-bold text-gray-900">
              Rp {jeep.pricePerDay.toLocaleString('id-ID')}
            </div>
          </div>
          <button 
            onClick={handleRentNow}
            className="px-6 py-2.5 bg-blue-600 text-white border-none rounded-full text-[13px] font-bold cursor-pointer transition-all hover:bg-blue-700 active:scale-95 font-sans shadow-[0_4px_12px_rgba(37,99,235,0.3)] flex items-center justify-center min-w-[120px] shrink-0"
          >
            Sewa Sekarang
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
