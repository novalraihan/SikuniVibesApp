import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, Home, ChevronLeft, ChevronRight, Users, BedDouble, Bath } from 'lucide-react';
import { Property, Promo } from '../../types';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { getPromos } from '../../services/firebase/promos';
import { calculateBestPrice } from '../../utils/pricing';

interface Props {
  property: Property;
  categoryName?: string;
  className?: string;
}

let cachedPromos: Promo[] | null = null;
let promosPromise: Promise<Promo[]> | null = null;

export const PropertyCard: React.FC<Props> = ({ property, categoryName, className = '' }) => {
  const { user } = useAuthStore();
  const { wishlistIds, toggleItem } = useWishlistStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [promos, setPromos] = useState<Promo[]>(cachedPromos || []);
  
  useEffect(() => {
    if (cachedPromos) {
      setPromos(cachedPromos);
      return;
    }
    if (!promosPromise) {
      promosPromise = getPromos(true).then(data => {
        cachedPromos = data;
        return data;
      });
    }
    promosPromise.then(data => setPromos(data));
  }, []);

  const isWishlisted = wishlistIds.includes(property.id);

  const priceInfo = calculateBestPrice(property, promos);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(user?.uid, property.id);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  return (
    <Link to={`/properties/${property.id}`} className={`group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all no-underline border border-gray-100 ${className}`}>
      <div className="relative aspect-video sm:aspect-[4/3] overflow-hidden bg-gray-100">
        {property.images && property.images.length > 0 ? (
          <>
            <img 
              src={property.images[currentImageIndex]} 
              alt={property.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {property.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-10 w-10 text-gray-300" />
          </div>
        )}
        
        {/* Promo Label */}
        {priceInfo.appliedPromo && priceInfo.appliedPromo.labelUrl && (
          <div className="absolute bottom-0 left-0 z-20 h-10 overflow-hidden">
            <img src={priceInfo.appliedPromo.labelUrl} alt="Promo Label" className="h-full w-auto object-contain" loading="lazy" />
          </div>
        )}

        {/* Favorite Button */}
        <button 
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors z-20" 
          onClick={handleWishlistClick}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>
      
      <div className="flex flex-col flex-1 p-3">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-[15px] font-bold text-gray-900 line-clamp-1 leading-tight">{property.name}</h3>
          <div className="flex items-center gap-1 text-[13px] font-bold text-gray-900 shrink-0">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span>{property.ratingAverage > 0 ? property.ratingAverage.toFixed(1) : 'New'}</span>
            {property.reviewCount > 0 && (
              <span className="text-gray-400 font-normal">({property.reviewCount})</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[13px] text-gray-500 mb-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{property.location || 'Sikunir, Dieng, Wonosobo'}</span>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-3">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{property.bedrooms} Bed</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{property.bathrooms} Bath</span>
            </div>
          )}
          {property.maxGuests !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>Max {property.maxGuests}</span>
            </div>
          )}
        </div>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {priceInfo.hasDiscount && (
              <span className="text-[12px] text-gray-400 line-through">Rp {priceInfo.originalPrice.toLocaleString('id-ID')}</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] font-extrabold text-gray-900 tracking-tight">Rp {priceInfo.discountedPrice.toLocaleString('id-ID')}</span>
              <span className="text-[12px] text-gray-400 font-medium">/ night</span>
            </div>
          </div>
          {property.badgeLabel && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {property.badgeLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
