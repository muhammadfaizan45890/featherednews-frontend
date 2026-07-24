import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import { Clock, Calendar, User } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// ─── Realistic News Data (replace with your API data) ────
const latestStories = [
  {
    id: 1,
    title: 'Doomsday Protocol: New Thriller Ignites Box Office',
    excerpt:
      'The action-packed film depicting a global cyber‑war has become the summer’s biggest hit, drawing audiences with its high‑stakes plot and stunning visual effects.',
    category: 'Entertainment',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80', // cinema
    author: { name: 'Movie Insider' },
    date: 'July 24, 2026',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Iran–US Tensions Rise Amid Nuclear Standoff',
    excerpt:
      'Diplomatic efforts stall as both nations exchange warnings over uranium enrichment, raising fears of military confrontation in the Persian Gulf.',
    category: 'World News',
    image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80', // geopolitics
    author: { name: 'Global Affairs' },
    date: 'July 24, 2026',
    readTime: '6 min read',
  },
  {
    id: 3,
    title: 'Tech Giants Pledge $50B for AI Safety Research',
    excerpt:
      'Major companies join forces to fund new safety frameworks, aiming to ensure responsible development of advanced AI systems.',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    author: { name: 'Tech Daily' },
    date: 'July 23, 2026',
    readTime: '4 min read',
  },
  {
    id: 4,
    title: 'Climate Deal Reached: Nations Agree to Cut Methane',
    excerpt:
      'After intense negotiations, over 100 countries commit to reducing methane emissions by 30% before 2030, a major step toward curbing global warming.',
    category: 'Environment',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    author: { name: 'Eco Watch' },
    date: 'July 22, 2026',
    readTime: '5 min read',
  },
  {
    id: 5,
    title: 'Champions League Final Sets Viewership Record',
    excerpt:
      'The thrilling match between two European giants drew over 600 million viewers worldwide, solidifying football’s status as the world’s most popular sport.',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
    author: { name: 'Sports Desk' },
    date: 'July 21, 2026',
    readTime: '3 min read',
  },
  {
    id: 6,
    title: 'Inflation Cools, Markets Rally on Fed Signals',
    excerpt:
      'New data shows a slowdown in price growth, prompting a surge in global stock markets as investors anticipate a pause in interest rate hikes.',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    author: { name: 'Market Analyst' },
    date: 'July 20, 2026',
    readTime: '4 min read',
  },
];

// ─── Individual Card Component ─────────────────────────────
const Card = ({ post, isActive }) => (
  <div
    className={`
      relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
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
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content overlay */}
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
            {post.author.name}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Slider Component ──────────────────────────────────
const FeaturedStories = ({ posts = latestStories }) => {
  const swiperRef = useRef(null);

  if (!posts.length) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        <p className="text-xl font-medium">No featured posts</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-to-b from-gray-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900 py-8 sm:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[4px] text-red-500">
              Featured Stories
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Editor's Picks
            </h2>
          </div>
          {/* No arrows – removed */}
        </div>

        {/* ─── Swiper ─────────────────────────────────────────── */}
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
            <SwiperSlide key={post.id} className="py-4">
              {({ isActive }) => <Card post={post} isActive={isActive} />}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ─── Custom Styles ────────────────────────────────── */}
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
