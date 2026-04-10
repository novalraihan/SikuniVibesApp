import { Link } from 'react-router-dom';
import { Tent, Instagram, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Tent className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">Sikunir Vibes</span>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Tentang Kami
            </Link>
            <Link to="/help" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Pusat Bantuan
            </Link>
            <Link to="/terms" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Syarat & Ketentuan
            </Link>
            <Link to="/privacy" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Kebijakan Privasi
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {settings?.socialInstagram && (
              <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {settings?.socialYoutube && (
              <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            )}
            {settings?.socialTiktok && (
              <a href={settings.socialTiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            )}
          </div>

          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Sikunir Vibes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
