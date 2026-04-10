import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { ArrowLeft } from 'lucide-react';

interface TopBarProps {
  title: string;
  showBack?: boolean;
}

export function TopBar({ title, showBack = true }: TopBarProps) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="flex items-center gap-2">
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-6 w-auto" />
          )}
          <h1 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">{title}</h1>
        </div>
      </div>
      
      {/* Optional: Add user profile or notifications here if needed */}
    </div>
  );
}
