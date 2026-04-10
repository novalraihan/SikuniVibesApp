import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TourPackage, Property, Attraction } from '../../types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getActiveProperties } from '../../services/firebase/properties';
import { getAttractions } from '../../services/firebase/attractions';
import { MapPin, Clock, Package, CheckCircle, ChevronLeft, Calendar } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export function TourPackageDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'tour-packages', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const tpData = { id: docSnap.id, ...docSnap.data() } as TourPackage;
          setTourPackage(tpData);

          // Fetch related properties
          const allProps = await getActiveProperties();
          if (tpData.propertyIds && tpData.propertyIds.length > 0) {
            setProperties(allProps.filter(p => tpData.propertyIds!.includes(p.id)));
          } else {
            setProperties(allProps);
          }

          // Fetch related attractions
          if (tpData.attractionIds && tpData.attractionIds.length > 0) {
            const allAttractions = await getAttractions(true);
            setAttractions(allAttractions.filter(a => tpData.attractionIds!.includes(a.id)));
          }
        }
      } catch (error) {
        console.error('Error fetching tour package details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tourPackage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paket Wisata Tidak Ditemukan</h1>
        <button onClick={() => navigate(-1)} className="text-primary font-medium">Kembali</button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <SEO title={`${tourPackage.name} - Sikunir Vibes`} description={tourPackage.description} />
      
      {/* Header Image */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <img 
          src={tourPackage.images[0] || 'https://via.placeholder.com/800x600'} 
          alt={tourPackage.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {tourPackage.duration && (
              <span className="bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> {tourPackage.duration}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{tourPackage.name}</h1>
          <p className="text-white/90 text-lg font-medium">Rp {tourPackage.price.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Description */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deskripsi Paket</h2>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">{tourPackage.description}</p>
        </section>

        {/* Included Services */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Layanan Termasuk
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tourPackage.includedServices.map((service, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-700">{service}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Included Attractions */}
        {attractions.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Destinasi Wisata
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attractions.map(attraction => (
                <div key={attraction.id} className="flex gap-3 items-center border border-gray-100 p-3 rounded-xl">
                  <img 
                    src={attraction.images[0] || 'https://via.placeholder.com/100'} 
                    alt={attraction.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{attraction.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{attraction.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Properties */}
        {properties.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Pilihan Penginapan
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Paket ini tersedia untuk penginapan berikut. Silakan pilih penginapan untuk memesan paket ini.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map(property => (
                <div key={property.id} className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                  <img 
                    src={property.images[0]} 
                    alt={property.name}
                    className="w-full h-32 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{property.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-3">{property.location}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/properties/${property.id}?tourPackageId=${tourPackage.id}`)}
                      className="w-full py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors text-sm"
                    >
                      Pilih Penginapan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-6 inset-x-0 flex flex-col items-center z-50 px-6 animate-[slideUp_0.4s_ease-out_forwards]">
        <div className="w-full max-w-[342px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-4 py-2 flex items-center justify-between rounded-full">
          <div className="leading-[1.2] pl-2 flex-1">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">Harga Paket</div>
            <div className="text-[16px] font-bold text-gray-900">
              Rp {tourPackage.price.toLocaleString('id-ID')}
            </div>
          </div>
          <button 
            onClick={() => {
              const message = `Halo, saya tertarik dengan Paket Wisata: ${tourPackage.name}. Bisa minta informasi lebih lanjut?`;
              window.dispatchEvent(new CustomEvent('openChatbot', { detail: { message } }));
            }}
            className="px-6 py-2.5 bg-primary text-white border-none rounded-full text-[13px] font-bold cursor-pointer transition-all hover:bg-primary-dark active:scale-95 font-sans shadow-[0_4px_12px_rgba(37,99,235,0.3)] flex items-center justify-center min-w-[120px] shrink-0"
          >
            Tanya Admin
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
