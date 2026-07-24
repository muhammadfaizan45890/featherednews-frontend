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

// ─── Individual Card Component ─────────────────────────────
const Card = ({ post, isActive }) => {
  const slug = post.slug || post.id || post._id;

  return (
    <Link
      to={`/article/${slug}`} // ✅ changed from /news to /article
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

  if (loading) {
    return (
      <div className="w-full py-12 text-center text-gray-500 dark:text-gray-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent" />
        <p className="mt-2 text-sm">Loading featured stories…</p>
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
    <div className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-8 sm:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[4px] text-red-500">
              Featured Stories
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Editor's Picks
            </h2>
          </div>
        </div>

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

        <style jsx>{`
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
    </div>
  );
};

export default FeaturedStories;
