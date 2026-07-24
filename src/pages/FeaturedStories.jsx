import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import { Clock, Calendar, User } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// ─── Blog Posts Data (replace with your API data) ─────────
const featuredPosts = [
  {
    id: 1,
    title: "The Future of AI in Content Creation",
    excerpt: "Explore how artificial intelligence is transforming the way we create, distribute, and consume content across digital platforms.",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    author: { name: "Sarah Johnson" },
    date: "July 15, 2026",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Sustainable Travel: A Guide to Eco-Friendly Adventures",
    excerpt: "Discover how to explore the world while minimizing your environmental impact and supporting local communities.",
    category: "Travel",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
    author: { name: "Michael Chen" },
    date: "July 12, 2026",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Mastering the Art of Slow Living",
    excerpt: "In a world that never stops, learn how embracing slowness can lead to greater fulfillment, creativity, and well-being.",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80",
    author: { name: "Emma Williams" },
    date: "July 10, 2026",
    readTime: "6 min read",
  },
  {
    id: 4,
    title: "The Psychology of Color in Branding",
    excerpt: "Understanding how color choices influence consumer behavior and brand perception in the modern marketplace.",
    category: "Business",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
    author: { name: "David Rodriguez" },
    date: "July 8, 2026",
    readTime: "7 min read",
  },
  {
    id: 5,
    title: "Plant-Based Cooking for Beginners",
    excerpt: "Simple, delicious, and nutritious plant-based recipes that will transform your kitchen and your health.",
    category: "Food",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    author: { name: "Lisa Park" },
    date: "July 5, 2026",
    readTime: "5 min read",
  }
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
const FeaturedStories = ({ posts = featuredPosts }) => {
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
