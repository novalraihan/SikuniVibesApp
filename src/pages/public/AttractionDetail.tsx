import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  MapPin, 
  ArrowLeft, 
  Share2, 
  Star, 
  Clock, 
  Info, 
  Navigation,
  ChevronRight,
  Ticket,
  Camera,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../../components/common/SEO';
import { PropertyCard } from '../../components/property/PropertyCard';
import { Attraction, Property, Category } from '../../types';

export function AttractionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'attractions', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const attractionData = { id: docSnap.id, ...docSnap.data() } as Attraction;
          setAttraction(attractionData);

          // Fetch properties and categories
          const [propsSnapshot, catsSnapshot] = await Promise.all([
            getDocs(collection(db, 'properties')),
            getDocs(collection(db, 'categories'))
          ]);

          const propsData = propsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Property));
          const catsData = catsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));

          setCategories(catsData);

          // Filter properties that have this attraction nearby
          const nearby = propsData.filter(p => 
            p.isActive && 
            p.nearbyAttractions?.some(na => na.attractionId === id)
          ).sort((a, b) => {
            const distA = a.nearbyAttractions?.find(na => na.attractionId === id)?.distance || 0;
            const distB = b.nearbyAttractions?.find(na => na.attractionId === id)?.distance || 0;
            return distA - distB;
          }).slice(0, 4);

          setNearbyProperties(nearby);
        }
      } catch (error) {
        console.error('Error fetching attraction details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: attraction?.name,
        text: attraction?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link disalin ke clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Info className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Wisata tidak ditemukan</h2>
        <p className="text-gray-500 mt-2 mb-6">Maaf, destinasi wisata yang Anda cari tidak tersedia.</p>
        <Link to="/attractions" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      <SEO title={`${attraction.name} - Destinasi Wisata Dieng`} description={attraction.description} />
      
      {/* Top Header / Hero */}
      <div className="relative h-[45vh] sm:h-[60vh] w-full overflow-hidden">
        {attraction.images && attraction.images.length > 0 ? (
          <img 
            src={attraction.images[activeImage]} 
            alt={attraction.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <ImageIcon className="w-24 h-24 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Navigation Buttons */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {attraction.category || 'Destinasi'}
              </span>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span>4.8 (120+ Reviews)</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 leading-tight">{attraction.name}</h1>
            <div className="flex items-center gap-2 text-white/90 text-sm sm:text-base">
              <MapPin className="w-4 h-4" />
              <span>{attraction.location}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Jam Buka</span>
                <span className="text-xs font-bold text-gray-900 mt-1">{attraction.openingHours || '08:00 - 17:00'}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-2">
                  <Ticket className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Tiket Masuk</span>
                <span className="text-xs font-bold text-gray-900 mt-1">
                  {attraction.ticketPrice ? `Rp ${attraction.ticketPrice.toLocaleString('id-ID')}` : 'Mulai Rp 15rb'}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Spot Foto</span>
                <span className="text-xs font-bold text-gray-900 mt-1">Sangat Bagus</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-2">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Waktu Terbaik</span>
                <span className="text-xs font-bold text-gray-900 mt-1">Pagi Hari</span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {attraction.images && attraction.images.length > 1 && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Galeri Foto</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {attraction.images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative min-w-[100px] h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === idx ? 'border-blue-600 scale-95' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tentang Destinasi</h2>
              <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                {attraction.description.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>

              {/* Facilities */}
              {attraction.facilities && attraction.facilities.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Fasilitas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {attraction.facilities.map((facility, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {facility}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Tips Berkunjung</h3>
              </div>
              <ul className="space-y-3">
                {(attraction.tips || [
                  'Gunakan pakaian hangat karena suhu bisa sangat dingin.',
                  'Datanglah lebih pagi untuk menghindari kerumunan.',
                  'Siapkan kamera dengan baterai penuh.',
                  'Patuhi aturan kebersihan di lokasi wisata.'
                ]).map((tip, i) => (
                  <li key={i} className="flex gap-3 text-white/90 text-sm leading-relaxed">
                    <span className="font-bold text-white/50">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Location Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lokasi & Navigasi</h3>
              <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4 relative group">
                <img 
                  src={`https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400`} 
                  alt="Map Placeholder" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-3 rounded-full shadow-lg text-blue-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {attraction.location}
              </p>
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name + ' ' + attraction.location)}`, '_blank')}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                <Navigation className="w-5 h-5" />
                Buka di Google Maps
              </button>
            </div>

            {/* Nearby Properties */}
            {nearbyProperties.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Penginapan Terdekat</h3>
                  <Link to="/explore" className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {nearbyProperties.map(property => {
                    const category = categories.find(c => c.id === property.categoryId);
                    return (
                      <PropertyCard 
                        key={property.id}
                        property={property} 
                        categoryName={category?.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
