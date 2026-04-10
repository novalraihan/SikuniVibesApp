import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getActiveProperties } from '../services/firebase/properties';
import { Property } from '../types';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function MapPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getActiveProperties();
        setProperties(data.filter(p => p.isActive && p.coordinates && p.coordinates.lat !== 0 && p.coordinates.lng !== 0));
      } catch (error) {
        console.error("Error fetching properties for map:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Default center (Dieng, Wonosobo)
  const defaultCenter: [number, number] = [-7.2052, 109.9038];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-8 w-8 text-indigo-600" />
            Peta Lokasi Properti
          </h1>
          <p className="text-gray-600 mt-2">Temukan penginapan terbaik di sekitar Anda</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-200px)] min-h-[400px] md:h-[600px] relative z-0">
          <MapContainer 
            center={properties.length > 0 && properties[0].coordinates ? [properties[0].coordinates.lat, properties[0].coordinates.lng] : defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {properties.map((property) => (
              property.coordinates && (
                <Marker 
                  key={property.id} 
                  position={[property.coordinates.lat, property.coordinates.lng]}
                >
                  <Popup className="custom-popup">
                    <div className="w-48">
                      <img 
                        src={property.images[0]} 
                        alt={property.name} 
                        className="w-full h-32 object-cover rounded-t-lg"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{property.name}</h3>
                        <p className="text-indigo-600 font-medium text-sm mt-1">
                          Rp {property.basePrice.toLocaleString('id-ID')} <span className="text-gray-500 text-xs font-normal">/ malam</span>
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{property.ratingAverage > 0 ? property.ratingAverage.toFixed(1) : 'Baru'}</span>
                        </div>
                        <button 
                          onClick={() => navigate(`/properties/${property.id}`)}
                          className="mt-3 block w-full text-center bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
