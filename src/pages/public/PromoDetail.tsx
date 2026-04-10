import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Promo, Property } from '../../types';
import { ArrowLeft, Tag, Calendar, Info, Copy, CheckCircle2, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../../components/common/SEO';
import { PropertyCard } from '../../components/property/PropertyCard';

export default function PromoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [applicableProperties, setApplicableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPromo = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'promos', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const promoData = { id: docSnap.id, ...docSnap.data() } as Promo;
          const now = Date.now();
          
          if (!promoData.isActive || promoData.endDate < now) {
            setPromo(null);
            setLoading(false);
            return;
          }
          
          setPromo(promoData);

          // Fetch applicable properties if specified
          if (promoData.applicableProperties && promoData.applicableProperties.length > 0) {
            const propsSnapshot = await getDocs(collection(db, 'properties'));
            const propsData = propsSnapshot.docs
              .map(d => ({ id: d.id, ...d.data() } as Property))
              .filter(p => promoData.applicableProperties?.includes(p.id) && p.isActive);
            setApplicableProperties(propsData);
          } else {
            // If applies to all, fetch some active properties
            const propsSnapshot = await getDocs(query(collection(db, 'properties'), where('isActive', '==', true)));
            setApplicableProperties(propsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Property)).slice(0, 6));
          }
        }
      } catch (error) {
        console.error('Error fetching promo details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id]);

  const handleCopy = () => {
    if (promo) {
      navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Tag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Promo tidak ditemukan</h2>
        <p className="text-gray-500 mt-2 mb-6">Maaf, promo yang Anda cari tidak tersedia atau sudah berakhir.</p>
        <Link to="/promos" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200">
          Lihat Promo Lainnya
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      <SEO title={`${promo.title} - Promo Sikunir Vibes`} description={promo.description} />
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Detail Promo</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Promo Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={promo.imageUrl || 'https://picsum.photos/seed/promo/800/400'} 
                  alt={promo.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    {promo.label || 'Spesial'}
                  </span>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">{promo.title}</h2>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Berlaku: {new Date(promo.startDate).toLocaleDateString('id-ID')} - {new Date(promo.endDate).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span>{promo.discountType === 'percentage' ? `Diskon ${promo.discountAmount}%` : `Potongan Rp ${promo.discountAmount.toLocaleString('id-ID')}`}</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-8">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Gunakan Kode Promo</div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-3xl font-mono font-black text-blue-900 tracking-tighter">{promo.code}</div>
                    <button 
                      onClick={handleCopy}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                      }`}
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Tersalin' : 'Salin Kode'}
                    </button>
                  </div>
                </div>

                <div className="prose prose-blue max-w-none text-gray-600">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Deskripsi Promo</h3>
                  <p className="whitespace-pre-wrap leading-relaxed">{promo.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Terms & Conditions */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Syarat & Ketentuan
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Promo berlaku untuk pemesanan melalui website resmi Sikunir Vibes.
                </li>
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Promo tidak dapat digabungkan dengan promo lainnya.
                </li>
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  {promo.applicableProperties && promo.applicableProperties.length > 0 
                    ? 'Promo hanya berlaku untuk properti tertentu yang tertera di bawah.' 
                    : 'Promo berlaku untuk semua properti yang tersedia.'}
                </li>
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Pihak Sikunir Vibes berhak membatalkan promo jika ditemukan indikasi kecurangan.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Applicable Properties */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Gunakan di Properti</h3>
              <Link to="/explore" className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</Link>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {applicableProperties.length > 0 ? (
                applicableProperties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))
              ) : (
                <div className="bg-white p-8 rounded-3xl text-center border border-gray-100">
                  <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Tidak ada properti spesifik untuk promo ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
