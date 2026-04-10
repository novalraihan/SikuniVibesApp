import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Promo } from '../../types';
import { getPromos } from '../../services/firebase/promos';
import { Tag, Copy, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export function Promos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const data = await getPromos();
        const now = Date.now();
        setPromos(data.filter(p => p.isActive && p.endDate >= now));
      } catch (error) {
        console.error("Error fetching promos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="pb-10 max-w-7xl mx-auto px-0 sm:px-4 md:px-[5%] pt-0 sm:pt-6">
      <SEO 
        title="Promo & Diskon - Sikunir Vibes"
        description="Temukan promo dan diskon menarik untuk penginapan dan wisata di Dieng hanya di Sikunir Vibes."
        image={promos[0]?.imageUrl}
      />
      <div className="flex items-center gap-3 mb-8 px-4 sm:px-0 pt-6 sm:pt-0">
        <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center">
          <Tag className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">Promo & Diskon</h1>
          <p className="text-text-secondary text-sm md:text-base">Gunakan kode promo ini untuk mendapatkan harga terbaik.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-2xl h-48 animate-pulse border border-border"></div>
          ))
        ) : promos.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-surface rounded-2xl border border-border">
            <Tag className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Belum ada promo</h3>
            <p className="text-text-secondary">Nantikan promo menarik dari kami segera.</p>
          </div>
        ) : (
          promos.map((promo, index) => {
            const gradients = [
              'linear-gradient(135deg, #0066FF 0%, #4D9FFF 100%)',
              'linear-gradient(135deg, #FF5A1F 0%, #FFAB1F 100%)',
              'linear-gradient(135deg, #00B37E 0%, #4DDDBB 100%)',
              'linear-gradient(135deg, #7B3FE4 0%, #B975FF 100%)'
            ];
            const bgStyle = promo.imageUrl 
              ? { backgroundImage: `url(${promo.imageUrl})` }
              : { background: gradients[index % gradients.length] };

            return (
              <Link key={promo.id} to={`/promos/${promo.id}`} className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="h-32 bg-cover bg-center relative p-5 flex flex-col justify-end" style={bgStyle}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent/20"></div>
                  <div className="relative z-10">
                    <span className="inline-block bg-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-2">
                      {promo.discountType === 'percentage' ? `HEMAT ${promo.discountAmount}%` : `DISKON Rp ${promo.discountAmount.toLocaleString('id-ID')}`}
                    </span>
                    <h3 className="text-xl font-extrabold text-white leading-tight">{promo.title}</h3>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-text-secondary text-sm mb-4 flex-1 line-clamp-2">{promo.description}</p>
                  <div className="bg-surface-alt rounded-xl p-3 flex items-center justify-between border border-border border-dashed" onClick={(e) => e.preventDefault()}>
                    <div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Kode Promo</div>
                      <div className="font-mono font-bold text-primary text-lg">{promo.code}</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopy(promo.code);
                      }}
                      className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                    >
                      {copiedCode === promo.code ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-4 text-[11px] text-text-muted text-center font-medium">
                    Berlaku hingga {new Date(promo.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
