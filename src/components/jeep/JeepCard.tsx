import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Jeep } from '../../types';
import { Settings, Users, ShieldCheck, Info } from 'lucide-react';

interface JeepCardProps {
  jeep: Jeep;
}

export function JeepCard({ jeep }: JeepCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/jeeps/${jeep.id}`)}
      className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={jeep.images[0] || 'https://picsum.photos/seed/jeep/800/600'} 
          alt={jeep.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-bold text-blue-600 shadow-sm">
          Rp {jeep.pricePerDay.toLocaleString('id-ID')} / Hari
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[16px] font-bold text-gray-900 mb-1 line-clamp-1">{jeep.name}</h3>
        <p className="text-[13px] text-gray-500 mb-4 line-clamp-2">{jeep.description}</p>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] font-medium text-gray-600 truncate">{jeep.engine}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] font-medium text-gray-600">{jeep.capacity} Orang</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-green-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Asuransi & Driver</span>
          </div>
          <button className="text-[12px] font-bold text-blue-600 flex items-center gap-1">
            Detail <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
