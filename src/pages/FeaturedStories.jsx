import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules';
import { Clock, Calendar, User, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import API from '../utils/api';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

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
  <div className="w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] xl:w-[400px] shrink-0">
    <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] bg-gray-200 dark:bg-zinc-800 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
    <div className="mt-2 space-y-1.5">
      <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800" />
    </div>
  </div>
);

// ─── Individual Card ────────────────────────────────────────
const Card = ({ post, isActive, index }) => {
  const slug = post.slug || post.id || post._id;

  return (
    <Link
      to={`/article/${slug}`}
      className={`
        block relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] border border-transparent
        ${isActive
          ? 'scale-100 shadow-[0_2px_0_0_rgba(239,68,68,1)]'
          : 'scale-[0.92] opacity-50 blur-[0.5px]'
        }
        group bg-white dark:bg-zinc-800
      `}
    >
      {/* index tag — encodes position in this edition's lineup */}
      <span className="absolute top-0 left-0 z-10 bg-black/80 text-white text-[10px] font-bold tracking-widest px-2 py-1">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] relative">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-red-500 px-2.5 py-1">
              {post.category}
            </span>
            <ArrowUpRight
              size={16}
              className="text-white/0 group-hover:text-white translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300"
            />
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold leading-snug line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs sm:text-sm text-white/75 line-clamp-2 mt-1 hidden sm:block">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white/65 mt-1.5">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <User size={11} />
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
    <div className="mb-4 sm:mb-5">
      <span className="text-[11px] font-bold uppercase tracking-[3px] text-red-500">
        Featured Stories
      </span>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white leading-tight">
        Editor&apos;s Picks
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 max-w-2xl">
        Our handpicked selection of the most compelling stories from around the world.
      </p>
    </div>
  );

  // ─── Content area ─────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2.5 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!posts.length) {
      return (
        <div className="text-center py-14 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No featured stories available</p>
        </div>
      );
    }

    return (
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Autoplay, EffectCoverflow, Pagination]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 1.4,
          slideShadows: false,
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true, el: '.featured-pagination' }}
        speed={700}
        loop
        breakpoints={{
          480: { slidesPerView: 1.2, spaceBetween: 10 },
          640: { slidesPerView: 1.6, spaceBetween: 14 },
          768: { slidesPerView: 2.1, spaceBetween: 16 },
          1024: { slidesPerView: 2.6, spaceBetween: 20 },
          1280: { slidesPerView: 3.1, spaceBetween: 22 },
        }}
        className="hero-slider"
      >
        {posts.map((post, index) => (
          <SwiperSlide key={post.id || post._id} className="py-2">
            {({ isActive }) => <Card post={post} isActive={isActive} index={index} />}
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-5 sm:py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {renderHeader()}
        {renderContent()}
        {/* progress dots replace the removed forward/next control */}
        <div className="featured-pagination flex items-center justify-center gap-1.5 mt-3" />
      </div>

      {/* ─── Custom Styles ────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .hero-slider .swiper-slide {
          width: 240px;
          transition-property: transform, opacity, filter;
          transition-duration: 500ms;
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        @media (min-width: 480px) {
          .hero-slider .swiper-slide { width: 260px; }
        }
        @media (min-width: 640px) {
          .hero-slider .swiper-slide { width: 280px; }
        }
        @media (min-width: 768px) {
          .hero-slider .swiper-slide { width: 320px; }
        }
        @media (min-width: 1024px) {
          .hero-slider .swiper-slide { width: 360px; }
        }
        @media (min-width: 1280px) {
          .hero-slider .swiper-slide { width: 400px; }
        }
        .featured-pagination .swiper-pagination-bullet {
          width: 18px;
          height: 3px;
          border-radius: 0;
          background: rgba(0,0,0,0.15);
          opacity: 1;
          transition: background 0.3s ease, width 0.3s ease;
        }
        .dark .featured-pagination .swiper-pagination-bullet {
          background: rgba(255,255,255,0.2);
        }
        .featured-pagination .swiper-pagination-bullet-active {
          background: #ef4444;
          width: 28px;
        }
      `}</style>
    </div>
  );
};

export default FeaturedStories;
