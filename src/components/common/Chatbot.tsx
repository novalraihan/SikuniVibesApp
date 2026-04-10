import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, HeadphonesIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { getSiteSettings } from '../../services/firebase/settings';
import { getProperties } from '../../services/firebase/properties';
import { getJeeps } from '../../services/firebase/jeeps';
import { getBlogs } from '../../services/firebase/blogs';
import { useAuthStore } from '../../store/authStore';
import { createOrGetChatSession, addMessageToChat, updateChatStatus, markChatAsRead, ChatSession } from '../../services/firebase/chats';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export function Chatbot() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const MAX_MESSAGES = 5;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context data
  const [contextData, setContextData] = useState('');

  useEffect(() => {
    const handleOpenChat = (event: any) => {
      setIsOpen(true);
      if (event.detail?.message) {
        setInput(event.detail.message);
      }
    };
    window.addEventListener('openChatbot', handleOpenChat);
    return () => window.removeEventListener('openChatbot', handleOpenChat);
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const settings = await getSiteSettings();
        const properties = await getProperties();
        const jeeps = await getJeeps();
        const blogs = await getBlogs();
        
        const activeProperties = properties.filter(p => p.isActive);
        const activeJeeps = jeeps.filter(j => j.isActive);
        const activeBlogs = blogs.filter(b => b.isActive);
        
        let context = `Anda adalah seorang staf reservasi dan pemandu wisata lokal yang ramah di "Sikunir Vibes", Dieng. Nama Anda adalah "Bli Sikunir" (atau sesuaikan dengan karakter yang hangat). 

GAYA BAHASA & KEPRIBADIAN:
- Gunakan gaya bahasa manusia yang hangat, santai, dan sangat membantu. Hindari kesan kaku seperti asisten digital.
- Sapa pengguna dengan sebutan "Kak" atau "Kakak".
- Gunakan ekspresi yang natural seperti "Halo Kak! Ada yang bisa saya bantu hari ini?", "Wah, rencana liburan yang seru nih Kak!", "Boleh banget Kak, ini detailnya ya...".
- Jika tidak tahu jawaban pastinya, jangan mengarang. Katakan dengan jujur tapi tetap membantu, misalnya: "Waduh Kak, kalau untuk itu saya kurang tahu pasti. Tapi tenang, Kakak bisa langsung tanya ke tim CS kami ya, mereka pasti lebih paham."
- Berikan rekomendasi yang personal, seolah-olah Kakak sedang berbicara dengan teman yang ingin berkunjung ke Dieng.

TENTANG SIKUNIR VIBES:
${settings?.profile || 'Penginapan nyaman dengan pemandangan sunrise terbaik di Sikunir, Dieng.'}

PERATURAN & KEBIJAKAN:
${settings?.rules || 'Check-in jam 14:00, Check-out jam 12:00. Dilarang merokok di dalam kamar.'}

DATA PROPERTI (Sangat Penting untuk Akurasi):
`;
        activeProperties.forEach(p => {
          context += `- ${p.name}: Rp ${p.basePrice.toLocaleString('id-ID')}/malam, kapasitas ${p.maxGuests} orang. Fasilitas: ${p.amenities.join(', ')}. ${p.description}\n`;
          if (p.bookedDates && p.bookedDates.length > 0) {
            context += `  * PENTING: Sudah FULL BOOKED pada tanggal: ${p.bookedDates.join(', ')}\n`;
          } else {
            context += `  * Status: Tersedia (belum ada pesanan)\n`;
          }
        });

        context += `\nLAYANAN JEEP: \n`;
        activeJeeps.forEach(j => {
          context += `- ${j.name}: Rp ${j.pricePerDay.toLocaleString('id-ID')}/hari, kapasitas ${j.capacity} orang. ${j.description}\n`;
        });

        context += `\nINSTRUKSI KHUSUS:
1. Jika ditanya ketersediaan, CEK DATA TANGGAL DI ATAS. Jika tanggal yang ditanya ada di daftar "FULL BOOKED", katakan sudah penuh dengan nada empati dan tawarkan tanggal lain.
2. Jika pengguna ingin bicara dengan admin/manusia, katakan: "Siap Kak! Saya hubungkan ke tim CS kami ya. Mohon tunggu sebentar, nanti admin akan langsung balas di sini."
3. Arahkan booking melalui menu "Jelajah" di website ini.
4. Jangan memberikan informasi harga yang berbeda dari data di atas.
5. Selalu gunakan bahasa yang sopan, hangat, dan tidak kaku. Gunakan emoji sesekali agar lebih ramah.
`;
        setContextData(context);
      } catch (error) {
        console.error('Failed to fetch context for chatbot:', error);
      }
    };
    
    fetchContext();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let unsubscribe: () => void;

    const initChat = async () => {
      try {
        let userId = user?.uid;
        let userName = user?.displayName || 'Guest';

        if (!userId) {
          userId = localStorage.getItem('guestChatId');
          if (!userId) {
            userId = 'guest_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('guestChatId', userId);
          }
        }

        const session = await createOrGetChatSession(userId, userName);
        setChatSession(session);

        unsubscribe = onSnapshot(doc(db, 'chats', session.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as ChatSession;
            setChatSession(data);
            if (data.unreadUserCount > 0 && isOpen) {
              markChatAsRead(session.id, false);
            }
          }
        });
      } catch (error) {
        console.error('Failed to init chat:', error);
      }
    };

    initChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSession?.messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading || !chatSession) return;

    if (messageCount >= MAX_MESSAGES && chatSession.status === 'bot') {
      await addMessageToChat(chatSession.id, {
        sender: 'bot',
        text: `Maaf, Anda telah mencapai batas penggunaan asisten AI (${MAX_MESSAGES} pesan). Silakan hubungkan dengan Customer Service kami untuk bantuan lebih lanjut.`,
        timestamp: Date.now()
      });
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      await addMessageToChat(chatSession.id, {
        sender: 'user',
        text: userMessage,
        timestamp: Date.now()
      });
      
      if (chatSession.status === 'bot') {
        setMessageCount(prev => prev + 1);
      }
        const lowerMsg = userMessage.toLowerCase();
        const wantsHuman = lowerMsg.includes('admin') || lowerMsg.includes('cs') || lowerMsg.includes('manusia') || lowerMsg.includes('operator');

        if (wantsHuman) {
          await updateChatStatus(chatSession.id, 'human');
          await addMessageToChat(chatSession.id, {
            sender: 'bot',
            text: 'Baik, saya telah meneruskan pesan Anda ke tim Customer Service kami. Mohon tunggu sebentar, admin kami akan segera membalas pesan Anda.',
            timestamp: Date.now()
          });
        } else {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const contents = [
            ...chatSession.messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            })),
            { role: 'user', parts: [{ text: userMessage }] }
          ];

          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents as any,
            config: {
              systemInstruction: contextData,
              temperature: 0.7,
            }
          });

          await addMessageToChat(chatSession.id, {
            sender: 'bot',
            text: response.text || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setLoading(false);
      }
    };

  const requestHuman = async () => {
    if (!chatSession) return;
    await updateChatStatus(chatSession.id, 'human');
    await addMessageToChat(chatSession.id, {
      sender: 'bot',
      text: 'Anda sekarang terhubung dengan tim Customer Service kami. Silakan sampaikan pertanyaan Anda.',
      timestamp: Date.now()
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-28 md:bottom-12 right-10 md:right-12 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark hover:scale-105 transition-all z-50 animate-bounce-slow"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      <div 
        className={`fixed bottom-28 md:bottom-10 right-10 md:right-10 w-[calc(100vw-32px)] md:w-[380px] h-[500px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              {chatSession?.status === 'human' ? <HeadphonesIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">{chatSession?.status === 'human' ? 'Customer Service' : 'Asisten Sikunir Vibes'}</h3>
              <p className="text-[10px] text-white/80">Online</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {!chatSession ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {chatSession.messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender !== 'user' && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.sender === 'admin' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                      {msg.sender === 'admin' ? <HeadphonesIcon className="w-3.5 h-3.5 text-accent" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : msg.sender === 'admin'
                        ? 'bg-white border border-accent/20 text-text-primary rounded-tl-sm'
                        : 'bg-white border border-gray-100 text-text-primary rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className={`text-[9px] mt-1 block ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-text-muted'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
          {chatSession?.status === 'bot' && (
            <div className="mb-2 flex justify-center">
              <button 
                onClick={requestHuman}
                className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
              >
                <HeadphonesIcon className="w-3 h-3" />
                Hubungkan dengan Customer Service
              </button>
            </div>
          )}
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ketik pesan Anda..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
              disabled={loading || !chatSession}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !chatSession}
              className="absolute right-2 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
