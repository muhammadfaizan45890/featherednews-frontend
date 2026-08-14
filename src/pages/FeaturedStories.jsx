import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import { Clock, Calendar, User } from 'lucide-react';
import axios from 'axios';
import API from '../utils/api';

import 'swiper/css';
import 'swiper/css/effect-coverflow';

// ─── API instance ──────────────────────────────────────────
const api = axios.create({
  baseURL: API || import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Static fallback data ──────────────────────────────────
const staticStories = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80',
    category: 'News',
    title: 'At daybreak of the fifteenth day of my search',
    excerpt: 'When the amphitheater had cleared I crept stealthily to the top...',
    date: 'Apr 12, 2025',
    readTime: '5 min read',
    author: { name: 'Jane Doe' },
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80',
    category: 'Travel',
    title: 'Beyond the horizon lies a world of wonder',
    excerpt: 'The journey of a thousand miles begins with a single step.',
    date: 'Apr 10, 2025',
    readTime: '4 min read',
    author: { name: 'John Smith' },
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=600&q=80',
    category: 'Culture',
    title: 'Whispers of ancient civilizations',
    excerpt: 'Through the corridors of time, stories of forgotten empires echo.',
    date: 'Apr 8, 2025',
    readTime: '6 min read',
    author: { name: 'Alice Johnson' },
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
    category: 'Nature',
    title: 'Where the mountains meet the sky',
    excerpt: 'In the quiet embrace of nature, find peace that transcends the chaos.',
    date: 'Apr 5, 2025',
    readTime: '3 min read',
    author: { name: 'Bob Williams' },
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80',
    category: 'Business',
    title: 'The quiet forces reshaping the global economy',
    excerpt: 'Behind every headline number is a chain of decisions.',
    date: 'Apr 3, 2025',
    readTime: '7 min read',
    author: { name: 'Eva Chen' },
  },
];

// ─── Skeleton Card ─────────────────────────────────────────
const SkeletonCard = () => (
  <div className="w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] xl:w-[400px] shrink-0">
    <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] bg-gray-200 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
    <div className="mt-2 space-y-1.5">
      <div className="h-3 w-16 bg-gray-200" />
      <div className="h-4 w-full bg-gray-200" />
      <div className="h-4 w-2/3 bg-gray-200" />
      <div className="flex gap-3 mt-1">
        <div className="h-2.5 w-12 bg-gray-200" />
        <div className="h-2.5 w-12 bg-gray-200" />
      </div>
    </div>
  </div>
);

// ─── Individual Card ────────────────────────────────────────
const Card = ({ post, isActive }) => {
  const slug = post.slug || post.id || post._id;

  return (
    <Link
      to={`/article/${slug}`}
      className={`
        block relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        ${isActive ? 'scale-100' : 'scale-90 opacity-50 blur-[0.5px]'}
        group bg-white
      `}
    >
      <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] relative">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
          <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-red-500 px-2 py-0.5 mb-1.5">
            {post.category}
          </span>
          <h3 className="text-base sm:text-lg md:text-xl font-bold leading-tight line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs text-white/80 line-clamp-2 mt-0.5 hidden sm:block">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-white/70 mt-1.5">
            <span className="flex items-center gap-0.5">
              <Calendar size={10} />
              {post.date}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {post.readTime}
            </span>
            <span className="flex items-center gap-0.5 ml-auto">
              <User size={10} />
              {post.author?.name || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Main Component ─────────────────────────────────────────
const FeaturedStories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/featured');
        if (res.data.success && res.data.data.length > 0) {
          setPosts(res.data.data);
        } else {
          setPosts(staticStories);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching featured stories:', err);
        setError('Failed to load featured stories');
        setPosts(staticStories);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // ─── Render header – compact ─────────────────────────────
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-[3px] text-red-500">
          Featured Stories
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
          Editor's Picks
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
          Our handpicked selection of the most compelling stories from around the world.
        </p>
      </div>
      {/* View All link removed */}
    </div>
  );

  // ─── Content area ─────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500 bg-red-50 border border-red-200">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1.5 bg-black text-white text-xs hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!posts.length) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No featured stories available</p>
        </div>
      );
    }

    return (
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 1.5,
          slideShadows: false,
        }}
        // Removed autoplay – user controls manually
        speed={700}
        loop
        breakpoints={{
          480: { slidesPerView: 1.2, spaceBetween: 8 },
          640: { slidesPerView: 1.5, spaceBetween: 12 },
          768: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 2.5, spaceBetween: 20 },
          1280: { slidesPerView: 3, spaceBetween: 24 },
        }}
        className="featured-slider"
      >
        {posts.map((post) => (
          <SwiperSlide key={post.id || post._id} className="py-2">
            {({ isActive }) => <Card post={post} isActive={isActive} />}
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  return (
    <div className="w-full bg-white py-4 sm:py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {renderHeader()}
        {renderContent()}
      </div>

      {/* ─── Custom Styles ────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .featured-slider .swiper-slide {
          width: 240px;
          transition-property: transform, opacity, filter;
          transition-duration: 700ms;
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        @media (min-width: 480px) {
          .featured-slider .swiper-slide {
            width: 260px;
          }
        }
        @media (min-width: 640px) {
          .featured-slider .swiper-slide {
            width: 280px;
          }
        }
        @media (min-width: 768px) {
          .featured-slider .swiper-slide {
            width: 320px;
          }
        }
        @media (min-width: 1024px) {
          .featured-slider .swiper-slide {
            width: 360px;
          }
        }
        @media (min-width: 1280px) {
          .featured-slider .swiper-slide {
            width: 400px;
          }
        }
        /* Remove all rounded corners globally for this component */
        .featured-slider .swiper-slide,
        .featured-slider .swiper-slide * {
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default FeaturedStories;
