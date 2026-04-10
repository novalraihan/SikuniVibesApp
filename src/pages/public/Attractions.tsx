import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowLeft, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Attraction } from '../../types';

export default function Attractions() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = ['Semua', 'Alam', 'Budaya', 'Sejarah', 'Kuliner', 'Religi'];

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const q = query(collection(db, 'attractions'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attraction));
        setAttractions(data);
      } catch (error) {
        console.error('Error fetching attractions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttractions();
  }, []);

  const filteredAttractions = attractions.filter(attraction => {
    const matchesSearch = attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         attraction.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || attraction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Destinasi Wisata</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Cari tempat wisata atau lokasi..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl h-72 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : filteredAttractions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredAttractions.map((attraction, index) => (
              <motion.div
                key={attraction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  to={`/attractions/${attraction.id}`}
                  className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 no-underline"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={attraction.images?.[0] || 'https://images.unsplash.com/photo-1506744626753-eba7bc20d5ad?auto=format&fit=crop&q=80&w=800'} 
                      alt={attraction.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-xs font-medium text-white/90 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{attraction.location}</span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight">{attraction.name}</h3>
                    </div>
                    {attraction.category && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {attraction.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {attraction.description}
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-bold group-hover:gap-2 transition-all">
                      Lihat Detail <span className="ml-1">→</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tidak ada hasil ditemukan</h3>
            <p className="text-gray-500 mt-1">Coba cari dengan kata kunci lain atau kategori berbeda.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
