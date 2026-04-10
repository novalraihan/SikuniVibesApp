import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Chatbot } from '../common/Chatbot';

export function MainLayout() {
  const location = useLocation();
  const isCheckout = location.pathname.startsWith('/checkout/');
  const hideChatbot = isCheckout;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
      <Footer />
      {!hideChatbot && <Chatbot />}
    </div>
  );
}
