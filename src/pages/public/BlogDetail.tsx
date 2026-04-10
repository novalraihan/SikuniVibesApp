import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { getBlogBySlug, Blog } from '../../services/firebase/blogs';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { SEO } from '../../components/common/SEO';
import { toast } from 'sonner';

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBlog(slug);
    }
  }, [slug]);

  const fetchBlog = async (slug: string) => {
    try {
      const data = await getBlogBySlug(slug);
      if (data) {
        setBlog(data);
      } else {
        navigate('/blogs');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 pb-24 md:pt-28">
        <div className="max-w-4xl mx-auto px-0 sm:px-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-10"></div>
          <div className="aspect-video bg-gray-200 rounded-3xl mb-10"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-white pt-20 pb-24 md:pt-28">
      <SEO 
        title={blog.title} 
        description={blog.content.substring(0, 150)}
        image={blog.imageUrl}
      />
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-0 sm:px-5 mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium px-5 sm:px-0">
          <Link to="/" className="hover:text-blue-600 transition-colors no-underline">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/blogs" className="hover:text-blue-600 transition-colors no-underline">Blog</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 line-clamp-1">{blog.title}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-0 sm:px-5">
        <header className="mb-10 px-5 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(blog.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Wisata
                </span>
              </div>
            </div>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden sm:rounded-3xl mb-12 shadow-2xl"
        >
          <img 
            src={blog.imageUrl || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80'} 
            alt={blog.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-12 px-5 sm:px-0">
          {/* Sidebar - Social Share */}
          <aside className="md:w-16 flex md:flex-col gap-4 order-2 md:order-1">
            <div className="sticky top-32 flex md:flex-col gap-4">
              <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100">
                <Facebook className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-400 hover:text-white transition-all border border-gray-100">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-all border border-gray-100">
                <LinkIcon className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all border border-gray-100">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 order-1 md:order-2">
            <div className="prose prose-lg max-w-none prose-blue prose-headings:font-extrabold prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-img:rounded-3xl prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
              <Markdown>{blog.content}</Markdown>
            </div>

            <div className="mt-16 pt-10 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Link 
                  to="/blogs"
                  className="flex items-center gap-2 text-gray-900 font-bold hover:text-blue-600 transition-colors no-underline"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali ke Blog
                </Link>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">Bagikan:</span>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all">
                      <Facebook className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-400 hover:text-white transition-all">
                      <Twitter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts Placeholder */}
      <section className="max-w-7xl mx-auto px-0 sm:px-5 mt-24">
        <div className="bg-gray-50 sm:rounded-[40px] p-8 md:p-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
            Ingin tahu lebih banyak tentang Dieng?
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            Dapatkan update terbaru seputar event, promo penginapan, dan tips wisata langsung di inbox Anda.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Alamat email Anda"
              className="flex-1 px-6 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              Berlangganan
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
