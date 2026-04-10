import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { HomePopupSettings } from '../../services/firebase/settings';
import { motion, AnimatePresence } from 'motion/react';

interface HomePopupProps {
  settings: HomePopupSettings;
}

export function HomePopup({ settings }: HomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!settings.enabled) return;

    const hasSeenPopup = localStorage.getItem('home_popup_seen');
    if (settings.showOnce && hasSeenPopup) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000); // Show after 2 seconds

    return () => clearTimeout(timer);
  }, [settings]);

  const handleClose = () => {
    setIsOpen(false);
    if (settings.showOnce) {
      localStorage.setItem('home_popup_seen', 'true');
    }
  };

  if (!settings.enabled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative"
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            {settings.imageUrl && (
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={settings.imageUrl} 
                  alt={settings.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            <div className={`p-8 ${settings.imageUrl ? '-mt-12 relative' : ''}`}>
              <div className={`${settings.imageUrl ? 'bg-white p-6 rounded-3xl shadow-xl border border-gray-100' : ''}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{settings.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-8">
                  {settings.description}
                </p>

                {settings.buttonUrl && (
                  <a 
                    href={settings.buttonUrl}
                    onClick={handleClose}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all group"
                  >
                    {settings.buttonText}
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
                
                <button 
                  onClick={handleClose}
                  className="w-full mt-3 py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
