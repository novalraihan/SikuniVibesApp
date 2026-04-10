import React, { useState, useEffect } from 'react';
import { Property, Category } from '../../types';
import { getActiveProperties } from '../../services/firebase/properties';
import { getCategories } from '../../services/firebase/categories';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { PropertyCard } from '../../components/property/PropertyCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { TopBar } from '../../components/layout/TopBar';

export function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState('');
  const [minBaths, setMinBaths] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [propsData, catsData, settingsData] = await Promise.all([
        getActiveProperties(),
        getCategories(),
        getSiteSettings()
      ]);
      setProperties(propsData);
      setCategories(catsData.filter(c => c.isActive));
      setSettings(settingsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('q');
    if (cat) setActiveCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setSearchParams(prev => {
      if (catId === 'all') prev.delete('category');
      else prev.set('category', catId);
      return prev;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchParams(prev => {
      if (!val) prev.delete('q');
      else prev.set('q', val);
      return prev;
    });
  };

  const filteredProperties = properties.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMinPrice = minPrice ? p.basePrice >= parseInt(minPrice) : true;
    const matchesMaxPrice = maxPrice ? p.basePrice <= parseInt(maxPrice) : true;
    const matchesMinBeds = minBeds ? (p.bedrooms || 0) >= parseInt(minBeds) : true;
    const matchesMinBaths = minBaths ? (p.bathrooms || 0) >= parseInt(minBaths) : true;
    
    return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice && matchesMinBeds && matchesMinBaths;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Jelajah Penginapan" showBack={true} />
      
      <div className="pb-10 max-w-7xl mx-auto px-4 md:px-[5%] pt-6">
        <div className="hidden md:flex items-center gap-3 mb-6">
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">Jelajah Penginapan</h1>
        </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari nama atau lokasi..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-3.5 bg-surface rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => setShowFilter(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surface border border-border rounded-xl font-semibold text-text-primary hover:border-primary transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filter
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        <button 
          className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-secondary hover:border-primary/50'}`}
          onClick={() => handleCategoryChange('all')}
        >
          Semua Kategori
        </button>
        {categories.map(category => (
          <button 
            key={category.id}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeCategory === category.id ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-secondary hover:border-primary/50'}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.iconUrl && (
              <img src={category.iconUrl} alt={category.name} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
            )}
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface rounded-2xl h-80 animate-pulse border border-border">
              <div className="h-48 bg-surface-deep rounded-t-2xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-surface-deep rounded w-3/4"></div>
                <div className="h-3 bg-surface-deep rounded w-1/2"></div>
                <div className="h-5 bg-surface-deep rounded w-1/3 mt-4"></div>
              </div>
            </div>
          ))
        ) : filteredProperties.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Tidak ada hasil</h3>
            <p className="text-text-secondary">Coba ubah kata kunci pencarian atau filter kategori.</p>
          </div>
        ) : (
          filteredProperties.map(property => {
            const category = categories.find(c => c.id === property.categoryId);
            return (
              <PropertyCard 
                key={property.id} 
                property={property} 
                categoryName={category?.name}
              />
            );
          })
        )}
      </div>

      {/* Filter Modal - Side Drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowFilter(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col animate-[slideInLeft_0.3s_ease-out]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Filter Pencarian</h3>
              <button onClick={() => setShowFilter(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Harga (Rp)</label>
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">MIN</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">MAX</span>
                    <input 
                      type="number" 
                      placeholder="Tanpa batas" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Min. Tempat Tidur</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['', '1', '2', '3+'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setMinBeds(val.replace('+', ''))}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                          (minBeds === val.replace('+', '') || (val === '3+' && parseInt(minBeds) >= 3))
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600'
                        }`}
                      >
                        {val || 'Semua'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Min. Kamar Mandi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['', '1', '2', '3+'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setMinBaths(val.replace('+', ''))}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                          (minBaths === val.replace('+', '') || (val === '3+' && parseInt(minBaths) >= 3))
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600'
                        }`}
                      >
                        {val || 'Semua'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setMinBeds('');
                  setMinBaths('');
                }}
                className="flex-1 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowFilter(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
