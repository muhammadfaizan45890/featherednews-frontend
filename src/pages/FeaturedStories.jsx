import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
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
  // ... (your existing static data)
];

// ─── Skeleton Card ─────────────────────────────────────────
const SkeletonCard = () => (
  <div className="w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] xl:w-[420px] shrink-0">
    <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] bg-gray-200 dark:bg-zinc-800 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800" />
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
        ${isActive 
          ? 'scale-100' 
          : 'scale-90 opacity-60 blur-[1px]'
        }
        group bg-white dark:bg-zinc-800
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

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-red-500 px-3 py-1 mb-2">
            {post.category}
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-white/80 line-clamp-2 mt-1 hidden sm:block">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 mt-2">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <User size={12} />
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

  // ─── Render header – always visible ──────────────────────
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[4px] text-red-500">
          Featured Stories
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
          Editor's Picks
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
          Our handpicked selection of the most compelling stories from around the world.
          Curated just for you.
        </p>
      </div>
      <Link
        to="/news"
        className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors hidden sm:inline-block mt-2 sm:mt-0"
      >
        View All →
      </Link>
    </div>
  );

  // ─── Content area ─────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!posts.length) {
      return (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-xl font-medium">No featured stories available</p>
        </div>
      );
    }

    return (
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Autoplay, EffectCoverflow]}
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
        autoplay={{
          delay: 3000,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        }}
        speed={800}
        loop
        breakpoints={{
          480: { slidesPerView: 1.2, spaceBetween: 12 },
          640: { slidesPerView: 1.5, spaceBetween: 20 },
          768: { slidesPerView: 2, spaceBetween: 24 },
          1024: { slidesPerView: 2.5, spaceBetween: 30 },
          1280: { slidesPerView: 3, spaceBetween: 32 },
        }}
        className="hero-slider"
      >
        {posts.map((post) => (
          <SwiperSlide key={post.id || post._id} className="py-4">
            {({ isActive }) => <Card post={post} isActive={isActive} />}
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-8 sm:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {renderHeader()}
        {renderContent()}
      </div>

      {/* ─── Custom Styles ────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .hero-slider .swiper-slide {
          width: 260px;
          transition-property: transform, opacity, filter;
          transition-duration: 700ms;
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        @media (min-width: 480px) {
          .hero-slider .swiper-slide {
            width: 280px;
          }
        }
        @media (min-width: 640px) {
          .hero-slider .swiper-slide {
            width: 300px;
          }
        }
        @media (min-width: 768px) {
          .hero-slider .swiper-slide {
            width: 340px;
          }
        }
        @media (min-width: 1024px) {
          .hero-slider .swiper-slide {
            width: 380px;
          }
        }
        @media (min-width: 1280px) {
          .hero-slider .swiper-slide {
            width: 420px;
          }
        }
      `}</style>
    </div>
  );
};

export default FeaturedStories;
