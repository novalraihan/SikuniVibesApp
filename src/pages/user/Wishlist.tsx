import React, { useEffect, useState } from 'react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { getProperty } from '../../services/firebase/properties';
import { Property, Category } from '../../types';
import { PropertyCard } from '../../components/property/PropertyCard';
import { Heart } from 'lucide-react';
import { getCategories } from '../../services/firebase/categories';

export function Wishlist() {
  const { user } = useAuthStore();
  const { wishlistIds, isLoading } = useWishlistStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    const fetchWishlistProperties = async () => {
      setLoadingProps(true);
      try {
        const cats = await getCategories();
        const catMap: Record<string, string> = {};
        cats.forEach(c => {
          catMap[c.id] = c.name;
        });
        setCategories(catMap);

        const props = await Promise.all(
          wishlistIds.map(id => getProperty(id))
        );
        setProperties(props.filter((p): p is Property => p !== null));
      } catch (error) {
        console.error('Failed to fetch wishlist properties', error);
      } finally {
        setLoadingProps(false);
      }
    };

    fetchWishlistProperties();
  }, [wishlistIds]);

  if (isLoading || loadingProps) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-accent fill-accent" />
        <h1 className="text-3xl font-bold text-text-primary">Wishlist Saya</h1>
      </div>

      {properties.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
          <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Belum ada properti di wishlist</h2>
          <p className="text-text-secondary mb-6">
            Simpan properti yang Anda sukai dengan menekan ikon hati.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(property => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              categoryName={categories[property.categoryId]} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
