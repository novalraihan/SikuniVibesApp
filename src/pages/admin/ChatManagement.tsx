import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChatSession, addMessageToChat, updateChatStatus, markChatAsRead } from '../../services/firebase/chats';
import { MessageCircle, Search, User, Bot, HeadphonesIcon, Send, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';

export const ChatManagement: React.FC = () => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatMobile, setShowChatMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => doc.data() as ChatSession);
      setChats(chatData);
      
      if (selectedChat) {
        const updatedSelected = chatData.find(c => c.id === selectedChat.id);
        if (updatedSelected) {
          setSelectedChat(updatedSelected);
          if (updatedSelected.unreadAdminCount > 0) {
            markChatAsRead(updatedSelected.id, true);
          }
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSelectChat = (chat: ChatSession) => {
    setSelectedChat(chat);
    setShowChatMobile(true);
    if (chat.unreadAdminCount > 0) {
      markChatAsRead(chat.id, true);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedChat) return;
    const newStatus = selectedChat.status === 'bot' ? 'human' : 'bot';
    await updateChatStatus(selectedChat.id, newStatus);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChat || sending) return;

    const messageText = input.trim();
    setInput('');
    setSending(true);

    try {
      if (selectedChat.status === 'bot') {
        await updateChatStatus(selectedChat.id, 'human');
      }
      
      await addMessageToChat(selectedChat.id, {
        sender: 'admin',
        text: messageText,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChat) return;
    if (window.confirm('Apakah Anda yakin ingin menutup percakapan ini?')) {
      await updateChatStatus(selectedChat.id, 'closed');
      setSelectedChat(null);
      setShowChatMobile(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.messages[chat.messages.length - 1]?.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex bg-white rounded-none md:rounded-2xl shadow-sm border-0 md:border border-border overflow-hidden relative">
      {/* Sidebar */}
      <div className={`
        w-full md:w-1/3 border-r border-border flex flex-col bg-surface-alt/30
        ${showChatMobile ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-4 border-b border-border bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-text-primary mb-4">Pesan Masuk</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-border-strong" />
              <p className="text-sm">Belum ada percakapan</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChats.map(chat => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                const isSelected = selectedChat?.id === chat.id;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full text-left p-4 hover:bg-surface transition-colors flex items-start gap-3 ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                      {chat.unreadAdminCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {chat.unreadAdminCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-sm text-text-primary truncate pr-2">{chat.userName}</h3>
                        <span className="text-[10px] text-text-muted whitespace-nowrap">
                          {new Date(chat.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${chat.unreadAdminCount > 0 ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                        {lastMessage?.sender === 'admin' ? 'Anda: ' : lastMessage?.sender === 'bot' ? 'Bot: ' : ''}
                        {lastMessage?.text || 'Mulai percakapan'}
                      </p>
                      <div className="mt-2 flex gap-1">
                        {chat.status === 'bot' && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium flex items-center gap-1"><Bot className="w-3 h-3" /> Bot</span>}
                        {chat.status === 'human' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium flex items-center gap-1"><HeadphonesIcon className="w-3 h-3" /> CS</span>}
                        {chat.status === 'closed' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Selesai</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col bg-white
        ${!showChatMobile ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowChatMobile(false)}
                  className="md:hidden p-2 -ml-2 hover:bg-surface-alt rounded-full text-text-secondary"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary text-sm md:text-base">{selectedChat.userName}</h2>
                  <p className="text-[10px] md:text-xs text-text-secondary">
                    Status: {selectedChat.status === 'bot' ? 'Ditangani Bot' : selectedChat.status === 'human' ? 'Ditangani CS' : 'Selesai'}
                  </p>
                </div>
              </div>
              
              {selectedChat.status !== 'closed' && (
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={handleToggleStatus}
                    className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] md:text-sm font-medium transition-colors"
                  >
                    {selectedChat.status === 'bot' ? 'CS' : 'Bot'}
                  </button>
                  <button
                    onClick={handleCloseChat}
                    className="px-2 md:px-3 py-1 md:py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] md:text-sm font-medium transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50">
              {selectedChat.messages.map((msg, idx) => {
                const isAdmin = msg.sender === 'admin';
                const isBot = msg.sender === 'bot';
                
                return (
                  <div key={idx} className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    {!isAdmin && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isBot ? 'bg-primary/10' : 'bg-gray-200'}`}>
                        {isBot ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-gray-500" />}
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isAdmin 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : isBot
                          ? 'bg-white border border-primary/20 text-text-primary rounded-tl-sm'
                          : 'bg-white border border-border text-text-primary rounded-tl-sm'
                    }`}>
                      {isBot && <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Bot Assistant</div>}
                      <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
                      <span className={`text-[10px] mt-1.5 block ${isAdmin ? 'text-white/70 text-right' : 'text-text-muted'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {selectedChat.status !== 'closed' ? (
              <div className="p-4 bg-white border-t border-border">
                {selectedChat.status === 'bot' && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] md:text-sm text-blue-800 flex items-start gap-2">
                    <HeadphonesIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" />
                    <p>Percakapan ini sedang ditangani oleh Bot. Jika Anda membalas, status akan otomatis berubah menjadi ditangani oleh CS (Manusia).</p>
                  </div>
                )}
                <div className="relative flex items-center">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ketik balasan Anda..."
                    className="w-full pl-4 pr-14 py-3 bg-surface-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all resize-none"
                    rows={2}
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="absolute right-3 bottom-3 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border-t border-border text-center text-sm text-text-secondary">
                Percakapan ini telah ditutup.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8 text-center">
            <MessageCircle className="w-16 h-16 mb-4 text-border-strong" />
            <h2 className="text-xl font-bold text-text-primary mb-2">Pilih Percakapan</h2>
            <p className="text-sm">Pilih percakapan dari daftar di sebelah kiri untuk mulai membalas.</p>
          </div>
        )}
      </div>
    </div>
  );
};
