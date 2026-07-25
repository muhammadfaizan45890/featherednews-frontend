import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Keyboard, A11y } from 'swiper/modules';
import { Clock, Calendar, User, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
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

const AUTOPLAY_DELAY = 4000;

// ─── Skeleton Card (loading state) ─────────────────────────
const SkeletonCard = () => (
  <div className="w-[260px] xs:w-[280px] sm:w-[300px] md:w-[340px] lg:w-[380px] xl:w-[420px] shrink-0">
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

// ─── Individual Card Component ─────────────────────────────
const Card = ({ post, isActive }) => {
  const slug = post.slug || post.id || post._id;

  return (
    <Link
      to={`/article/${slug}`}
      aria-label={post.title}
      className={`
        block relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        will-change-transform
        ${isActive ? 'scale-100' : 'scale-90 opacity-60 blur-[1px]'}
        group bg-white dark:bg-zinc-800
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-zinc-900
      `}
    >
      <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/9] relative">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3 xs:p-4 sm:p-6 text-white">
          {post.category && (
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-red-500 px-3 py-1 mb-2">
              {post.category}
            </span>
          )}
          <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold leading-tight line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 line-clamp-2 mt-1 hidden sm:block">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-white/70 mt-2">
            {post.date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {post.date}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readTime}
              </span>
            )}
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const swiperRef = useRef(null);
  const sectionRef = useRef(null);

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/featured');
      if (res.data.success && res.data.data.length > 0) {
        setPosts(res.data.data);
      } else {
        setPosts(staticStories);
      }
    } catch (err) {
      console.error('Error fetching featured stories:', err);
      setError('Failed to load featured stories');
      setPosts(staticStories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // Pause autoplay when the section scrolls out of view
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const swiper = swiperRef.current;
        if (!swiper) return;
        if (entry.isIntersecting) {
          if (!isPaused) swiper.autoplay?.start();
        } else {
          swiper.autoplay?.stop();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isPaused]);

  const handlePrev = () => swiperRef.current?.slidePrev();
  const handleNext = () => swiperRef.current?.slideNext();

  const togglePause = () => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    if (isPaused) {
      swiper.autoplay?.start();
    } else {
      swiper.autoplay?.stop();
    }
    setIsPaused((p) => !p);
  };

  // ─── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-8 sm:py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[4px] text-red-500">
              Featured Stories
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Editor's Picks
            </h2>
          </div>
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // ─── Error / empty state ─────────────────────────────────
  if (error && !posts.length) {
    return (
      <div className="text-center py-20 px-4 text-gray-500 dark:text-gray-400">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
        <p className="text-xl font-medium mb-4">Couldn't load featured stories</p>
        <button
          onClick={fetchFeatured}
          className="inline-flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-red-600 transition-colors"
        >
          <RefreshCw size={14} />
          Try again
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
    <div
      ref={sectionRef}
      className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-8 sm:py-12 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[3px] sm:tracking-[4px] text-red-500">
              Featured Stories
            </span>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Editor's Picks
            </h2>
          </div>

          {/* Nav controls — hidden on very small screens, swipe handles it there */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={togglePause}
              aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
              className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              {isPaused ? (
                <span className="block w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-current ml-0.5" />
              ) : (
                <span className="flex gap-[3px]">
                  <span className="block w-[3px] h-3 bg-current" />
                  <span className="block w-[3px] h-3 bg-current" />
                </span>
              )}
            </button>
            <button
              onClick={handlePrev}
              aria-label="Previous story"
              className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next story"
              className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
              setProgressKey((k) => k + 1);
            }}
            modules={[Autoplay, EffectCoverflow, Keyboard, A11y]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            keyboard={{ enabled: true }}
            a11y={{ enabled: true }}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 120,
              modifier: 1.5,
              slideShadows: false,
            }}
            autoplay={{
              delay: AUTOPLAY_DELAY,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
            }}
            speed={800}
            loop
            breakpoints={{
              0: { slidesPerView: 1.08, spaceBetween: 10 },
              480: { slidesPerView: 1.2, spaceBetween: 12 },
              640: { slidesPerView: 1.5, spaceBetween: 20 },
              768: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 2.5, spaceBetween: 30 },
              1280: { slidesPerView: 3, spaceBetween: 32 },
            }}
            className="hero-slider !pb-2"
          >
            {posts.map((post) => (
              <SwiperSlide key={post.id || post._id} className="py-4">
                {({ isActive }) => <Card post={post} isActive={isActive} />}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Edge fade masks so off-screen slides feel intentional, not clipped */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-gray-50 dark:from-zinc-900 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-10" />
        </div>

        {/* Progress / pagination bars */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6">
          {posts.map((post, i) => (
            <button
              key={post.id || post._id || i}
              aria-label={`Go to story ${i + 1}`}
              onClick={() => swiperRef.current?.slideToLoop(i)}
              className="relative h-1 flex-1 max-w-8 sm:max-w-10 bg-gray-200 dark:bg-zinc-700 overflow-hidden"
            >
              {i === activeIndex && !isPaused && (
                <span
                  key={progressKey}
                  className="absolute inset-y-0 left-0 bg-red-500 animate-[fillbar_linear_forwards]"
                  style={{ animationDuration: `${AUTOPLAY_DELAY}ms` }}
                />
              )}
              {i === activeIndex && isPaused && (
                <span className="absolute inset-y-0 left-0 right-0 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile nav controls, centered below pagination */}
        <div className="flex sm:hidden items-center justify-center gap-3 mt-4">
          <button
            onClick={handlePrev}
            aria-label="Previous story"
            className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-black dark:text-white active:bg-red-500 active:text-white active:border-red-500 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={togglePause}
            aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-black dark:text-white active:bg-red-500 active:text-white active:border-red-500 transition-colors"
          >
            {isPaused ? (
              <span className="block w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-current ml-0.5" />
            ) : (
              <span className="flex gap-[3px]">
                <span className="block w-[3px] h-3 bg-current" />
                <span className="block w-[3px] h-3 bg-current" />
              </span>
            )}
          </button>
          <button
            onClick={handleNext}
            aria-label="Next story"
            className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-zinc-700 text-black dark:text-white active:bg-red-500 active:text-white active:border-red-500 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {error && (
          <p className="text-center text-xs text-amber-600 dark:text-amber-400 mt-4">
            Showing cached stories — live data couldn't be reached.
          </p>
        )}

        <style>{`
          .hero-slider .swiper-slide {
            width: 240px;
            transition-property: transform, opacity, filter;
            transition-duration: 700ms;
            transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          @media (min-width: 480px) {
            .hero-slider .swiper-slide { width: 280px; }
          }
          @media (min-width: 640px) {
            .hero-slider .swiper-slide { width: 300px; }
          }
          @media (min-width: 768px) {
            .hero-slider .swiper-slide { width: 340px; }
          }
          @media (min-width: 1024px) {
            .hero-slider .swiper-slide { width: 380px; }
          }
          @media (min-width: 1280px) {
            .hero-slider .swiper-slide { width: 420px; }
          }

          @keyframes fillbar {
            from { width: 0%; }
            to { width: 100%; }
          }

          @media (prefers-reduced-motion: reduce) {
            .hero-slider .swiper-slide,
            .hero-slider .swiper-wrapper {
              transition: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FeaturedStories;
