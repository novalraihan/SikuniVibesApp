import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export function SEO({ 
  title = 'Sikunir Vibes - Penginapan Terbaik di Dieng', 
  description = 'Temukan penginapan terbaik dan nyaman di Dieng dengan Sikunir Vibes. Nikmati pemandangan alam yang indah dan fasilitas lengkap.', 
  keywords = 'penginapan dieng, homestay dieng, sikunir vibes, wisata dieng, sewa jeep dieng',
  image = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80', 
  url = window.location.href
}: SEOProps) {
  const siteTitle = title.includes('Sikunir Vibes') ? title : `${title} | Sikunir Vibes`;
  
  // Ensure image URL is absolute
  const absoluteImageUrl = image.startsWith('http') 
    ? image 
    : `${window.location.origin}${image}`;

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Sikunir Vibes" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      {absoluteImageUrl && <meta property="og:image" content={absoluteImageUrl} />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      {absoluteImageUrl && <meta property="twitter:image" content={absoluteImageUrl} />}
    </Helmet>
  );
}
