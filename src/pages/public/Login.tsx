import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { signInWithGoogle, signInWithEmail, registerWithEmail } from '../../services/firebase/auth';
import { LogIn, UserPlus, Mail, Lock, Phone, User as UserIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Login: React.FC = () => {
  const { user, isAuthReady } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState((location.state as any)?.isRegister || false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isAuthReady) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, isAuthReady, navigate, location]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Gagal login dengan Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        if (!email || !password || !username || !phone || !userId) {
          toast.error('Semua kolom harus diisi');
          setLoading(false);
          return;
        }
        const newUser = await registerWithEmail(email, password);
        // Save additional user data
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          displayName: username,
          phoneNumber: phone,
          customUserId: userId,
          role: 'user',
        }, { merge: true });
        toast.success('Pendaftaran berhasil!');
      } else {
        if (!email || !password) {
          toast.error('Email/No. HP/User ID dan password harus diisi');
          setLoading(false);
          return;
        }
        
        let loginEmail = email;
        
        // If it doesn't look like an email, try to find the user by phone or customUserId
        if (!email.includes('@')) {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const usersRef = collection(db, 'users');
          const qPhone = query(usersRef, where('phoneNumber', '==', email));
          const qUserId = query(usersRef, where('customUserId', '==', email));
          
          const [phoneSnap, userIdSnap] = await Promise.all([
            getDocs(qPhone),
            getDocs(qUserId)
          ]);
          
          if (!phoneSnap.empty) {
            loginEmail = phoneSnap.docs[0].data().email;
          } else if (!userIdSnap.empty) {
            loginEmail = userIdSnap.docs[0].data().email;
          } else {
            throw new Error('Akun tidak ditemukan dengan No. HP atau User ID tersebut');
          }
        }
        
        await signInWithEmail(loginEmail, password);
        toast.success('Login berhasil!');
      }
    } catch (error: any) {
      console.error('Auth failed:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <Helmet>
        <title>{isRegister ? 'Daftar' : 'Masuk'} | Sikunir Vibes</title>
      </Helmet>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${!isRegister ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${isRegister ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Daftar
          </button>
        </div>
        
        <div className="p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            {isRegister ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
          </h1>
          <p className="text-gray-500 mb-8 text-center text-sm">
            {isRegister 
              ? 'Daftar untuk mulai memesan penginapan dan bergabung dengan program affiliate kami.' 
              : 'Masuk untuk melanjutkan pemesanan dan mengakses fitur lainnya.'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">User ID</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="Masukkan User ID"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan Username"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">No. HP</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Masukkan No. HP"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {isRegister ? 'Email' : 'Email / No. HP / User ID'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={isRegister ? "email" : "text"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRegister ? "Masukkan Email" : "Masukkan Email, No. HP, atau User ID"}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Atau</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isRegister ? 'Daftar dengan Google' : 'Lanjutkan dengan Google'}
          </button>
          
          <div className="mt-8 text-sm text-gray-500 text-center">
            Dengan {isRegister ? 'mendaftar' : 'masuk'}, Anda menyetujui <br/>
            <a href="/terms" className="text-primary hover:underline">Syarat & Ketentuan</a> serta <a href="/privacy" className="text-primary hover:underline">Kebijakan Privasi</a> kami.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
