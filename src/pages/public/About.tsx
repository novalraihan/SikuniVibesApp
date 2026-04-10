import React, { useEffect, useState } from 'react';
import { getSiteSettings, SiteSettings } from '../../services/firebase/settings';
import { SEO } from '../../components/common/SEO';
import { QnASection } from '../../components/common/QnASection';
import { Instagram, Youtube, Phone, Mail, MapPin } from 'lucide-react';

export function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <SEO 
        title={`Tentang Kami - ${settings?.siteName || 'Sikunir Vibes'}`}
        description={settings?.siteDescription || 'Informasi tentang Sikunir Vibes'}
      />

      {/* Hero Section */}
      <div className="bg-indigo-600 text-white py-16 px-5 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Tentang Kami</h1>
        <p className="text-indigo-100 max-w-2xl mx-auto">
          Mengenal lebih dekat dengan {settings?.siteName || 'Sikunir Vibes'} dan layanan yang kami tawarkan.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-5 -mt-8 relative z-10 space-y-8">
        
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profil</h2>
          <div className="prose prose-indigo max-w-none text-gray-600 whitespace-pre-wrap">
            {settings?.profile || 'Belum ada informasi profil.'}
          </div>
        </div>

        {/* Social Media & Contact */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Hubungi Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {settings?.contactPhone && (
                <a 
                  href={`https://wa.me/${settings.contactPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">WhatsApp</div>
                    <div className="text-sm">+{settings.contactPhone}</div>
                  </div>
                </a>
              )}
              
              {settings?.socialInstagram && (
                <a 
                  href={settings.socialInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-pink-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Instagram</div>
                    <div className="text-sm">@sikunirvibes</div>
                  </div>
                </a>
              )}
            </div>

            <div className="space-y-4">
              {settings?.socialTiktok && (
                <a 
                  href={settings.socialTiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-black transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">TikTok</div>
                    <div className="text-sm">@sikunirvibes</div>
                  </div>
                </a>
              )}

              {settings?.socialYoutube && (
                <a 
                  href={settings.socialYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">YouTube</div>
                    <div className="text-sm">Sikunir Vibes</div>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        {settings?.qna && settings.qna.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <QnASection qnaList={settings.qna} />
          </div>
        )}

      </div>
    </div>
  );
}
