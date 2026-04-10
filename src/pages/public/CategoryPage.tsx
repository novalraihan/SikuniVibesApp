import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Property, Category } from '../../types';
import { getActiveProperties } from '../../services/firebase/properties';
import { getCategories } from '../../services/firebase/categories';
import { PropertyCard } from '../../components/property/PropertyCard';
import { SEO } from '../../components/common/SEO';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
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
    const fetchData = async () => {
      try {
        const [propsData, catsData] = await Promise.all([
          getActiveProperties(),
          getCategories()
        ]);
        
        const currentCategory = catsData.find(c => c.slug === slug);
        if (currentCategory) {
          setCategory(currentCategory);
          
          const filteredProps = propsData.filter(p => p.categoryId === currentCategory.id);
          setProperties(filteredProps);
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 font-sans relative">
      <SEO 
        title={category ? `Kategori ${category.name}` : 'Kategori Properti'} 
        description={`Jelajahi berbagai properti menarik di kategori ${category?.name || ''}.`}
        image={category?.imageUrl}
      />
      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 md:px-4 py-3 flex items-center gap-3 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm' 
          : 'bg-transparent text-white'
      }`}>
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors md:ml-0 ${
            !scrolled ? 'bg-black/20 hover:bg-black/40' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${!scrolled ? 'text-white' : 'text-gray-900'}`} />
        </button>
        <div className="flex-1">
          <h1 className={`text-[18px] font-bold leading-tight ${!scrolled ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>
            {category ? category.name : 'Kategori'}
          </h1>
          <p className={`text-[13px] ${!scrolled ? 'text-white/80' : 'text-gray-500'}`}>
            {properties.length} properti ditemukan
          </p>
        </div>
      </div>

      {/* Category Banner - Sticky Background Effect */}
      {category?.imageUrl && (
        <div className="w-full h-[180px] md:h-[250px] sticky top-0 z-0 overflow-hidden">
          <img 
            src={category.imageUrl} 
            alt={category.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 flex items-center justify-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-2xl mt-4">
              {category.name}
            </h2>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 bg-white rounded-t-[20px] md:rounded-t-[30px] -mt-4 md:-mt-8 min-h-[500px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:px-0">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-2">Belum ada properti</h2>
              <p className="text-[14px] text-gray-500">
                Belum ada properti yang tersedia untuk kategori ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
