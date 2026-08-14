import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API from "../utils/api";

// ─── Helper: reliable API instance ──────────────────
const getApiInstance = () => {
  let instance;
  if (API && typeof API.get === "function") {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
      headers: { "Content-Type": "application/json" },
    });
  }
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const api = getApiInstance();

// ─── Static fallback slides ──────────────────────────
const staticSlides = [
  {
    _id: 1,
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=80",
    category: "News • Featured",
    title: "At daybreak of the fifteenth day of my search",
    description:
      "When the amphitheater had cleared I crept stealthily to the top and, as the great excavation lay far from the plaza...",
    alt: "City architecture",
    buttonText: "Read More",
    link: "/news",
  },
  {
    _id: 2,
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1400&q=80",
    category: "Travel • Adventure",
    title: "Beyond the horizon lies a world of wonder",
    description:
      "The journey of a thousand miles begins with a single step. Explore the unknown and discover the beauty that awaits.",
    alt: "Mountain landscape",
    buttonText: "Explore Now",
    link: "/news",
  },
  {
    _id: 3,
    image:
      "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=1400&q=80",
    category: "Culture • Heritage",
    title: "Whispers of ancient civilizations",
    description:
      "Through the corridors of time, stories of forgotten empires echo, inviting us to uncover their timeless secrets.",
    alt: "Ancient ruins",
    buttonText: "Discover More",
    link: "/news",
  },
  {
    _id: 4,
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=80",
    category: "Nature • Serenity",
    title: "Where the mountains meet the sky",
    description:
      "In the quiet embrace of nature, find peace that transcends the chaos of everyday life and rejuvenates the soul.",
    alt: "Mountain lake",
    buttonText: "View Gallery",
    link: "/news",
  },
  {
    _id: 5,
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1400&q=80",
    category: "Business • Markets",
    title: "The quiet forces reshaping the global economy",
    description:
      "Behind every headline number is a chain of decisions. We trace the ones that matter most this quarter.",
    alt: "City skyline at dusk",
    buttonText: "Read More",
    link: "/news",
  },
  {
    _id: 6,
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1400&q=80",
    category: "Politics • Analysis",
    title: "Inside the negotiations no one was supposed to see",
    description:
      "Three sources, two continents, one deal that almost fell apart at the final hour.",
    alt: "Government building columns",
    buttonText: "Read More",
    link: "/news",
  },
];

const SLIDE_DURATION = 4000;
const INPUT_LOCK_MS = 200;

const Hero = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const autoPlayRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const liveRegionRef = useRef(null);

  const totalSlides = slides.length;

  // ─── Fetch slides ──────────────────────────────────
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/hero");
        if (res.data.success && res.data.data.length > 0) {
          setSlides(res.data.data);
        } else {
          setSlides(staticSlides);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching hero slides:", err);
        setError("Failed to load hero slides");
        setSlides(staticSlides);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // ─── Navigation (mobile carousel) ──────────────────
  const goToSlide = useCallback(
    (index) => {
      if (isLocked || totalSlides === 0) return;
      const targetIndex = ((index % totalSlides) + totalSlides) % totalSlides;
      setIsLocked(true);
      setCurrentIndex(targetIndex);

      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = setTimeout(() => {
        setIsLocked(false);
        lockTimeoutRef.current = null;
      }, INPUT_LOCK_MS);
    },
    [isLocked, totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // ─── Auto-play (mobile carousel only) ──────────────
  useEffect(() => {
    if (totalSlides === 0 || isPaused) return;
    autoPlayRef.current = setInterval(nextSlide, SLIDE_DURATION);
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [nextSlide, totalSlides, isPaused]);

  // ─── Preload images ──────────────────────────────
  useEffect(() => {
    if (totalSlides === 0) return;
    const nextIndex = (currentIndex + 1) % totalSlides;
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    [nextIndex, prevIndex].forEach((i) => {
      const img = new Image();
      img.src = slides[i]?.image;
    });
  }, [currentIndex, slides, totalSlides]);

  // ─── Screen reader (mobile carousel) ─────────────
  useEffect(() => {
    if (totalSlides === 0 || !liveRegionRef.current) return;
    liveRegionRef.current.textContent = `Slide ${currentIndex + 1} of ${totalSlides}: ${
      slides[currentIndex]?.title || ""
    }`;
  }, [currentIndex, slides, totalSlides]);

  // ─── Keyboard (mobile carousel) ──────────────────
  useEffect(() => {
    if (totalSlides === 0) return;
    const node = containerRef.current;
    if (!node) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
    };
    node.addEventListener("keydown", handleKeyDown);
    return () => node.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, totalSlides]);

  // ─── Touch (mobile carousel) ──────────────────────
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };
  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(0);
    setTouchEndX(0);
    setIsPaused(false);
  };

  // ─── Pause on hover / focus (mobile carousel) ────
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) setIsPaused(false);
  };

  // ─── Cleanup ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  // ─── Desktop card-grid data (lead + secondary rail) ──
  const leadSlide = slides[0];
  const secondarySlides = useMemo(() => slides.slice(1, 5), [slides]);

  // ─── Loading skeleton ──────────────────────────────────
  if (loading) {
    return (
      <section className="w-full bg-white py-4 md:py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:grid grid-cols-3 gap-4 xl:gap-5 h-[480px] xl:h-[560px]">
            <div className="col-span-2 bg-gray-200 animate-pulse rounded-lg" />
            <div className="grid grid-rows-3 gap-4 xl:gap-5">
              <div className="bg-gray-200 animate-pulse rounded-lg" />
              <div className="bg-gray-200 animate-pulse rounded-lg" />
              <div className="bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="lg:hidden w-full bg-gray-200 animate-pulse rounded-lg" style={{ height: "clamp(200px, 50vw, 480px)" }} />
        </div>
      </section>
    );
  }

  if (totalSlides === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="w-full bg-white py-4 md:py-6 lg:py-8 overflow-hidden"
      role="region"
      aria-label="Featured stories"
    >
      {/* ══════════ DESKTOP: Card Grid (lg+) ══════════ */}
      <div className="hidden lg:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 xl:gap-5 h-[480px] xl:h-[560px]">
          {leadSlide && (
            <Link
              to={leadSlide.link || "/news"}
              className="group relative col-span-2 h-full overflow-hidden rounded-lg bg-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <img
                src={leadSlide.image}
                alt={leadSlide.alt || leadSlide.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="eager"
                style={{ filter: "brightness(1.05) contrast(1.05)" }}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/1400x620?text=Image+Unavailable";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute left-0 right-0 bottom-0 p-6 xl:p-8 text-white" style={{ maxWidth: "680px" }}>
                <p className="uppercase text-red-400 font-semibold text-xs xl:text-sm tracking-[3px] mb-2">
                  ■ {leadSlide.category}
                </p>
                <h1 className="font-extrabold leading-tight text-2xl xl:text-4xl drop-shadow-xl line-clamp-3">
                  {leadSlide.title}
                </h1>
                <p className="text-white/90 leading-relaxed text-sm xl:text-base mt-3 line-clamp-2">
                  {leadSlide.description}
                </p>
                <span className="inline-flex items-center gap-2 mt-4 border-2 border-white bg-transparent group-hover:bg-white group-hover:text-black uppercase font-semibold text-xs xl:text-sm tracking-wide px-5 py-2.5 transition-colors duration-300">
                  {leadSlide.buttonText || "Read More"}
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          )}

          <div className="grid grid-rows-3 gap-4 xl:gap-5 h-full">
            {secondarySlides.map((slide, i) => (
              <Link
                key={slide._id || i}
                to={slide.link || "/news"}
                className="group relative overflow-hidden rounded-lg bg-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                <img
                  src={slide.image}
                  alt={slide.alt || slide.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                  style={{ filter: "brightness(1.05) contrast(1.05)" }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/700x300?text=Image+Unavailable";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute left-0 right-0 bottom-0 p-3 xl:p-4 text-white">
                  <p className="uppercase text-red-400 font-semibold text-[10px] xl:text-xs tracking-[2px] mb-1">
                    {slide.category}
                  </p>
                  <h2 className="font-bold leading-snug text-sm xl:text-base line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
                    {slide.title}
                  </h2>
                </div>
              </Link>
            ))}
            {Array.from({ length: Math.max(0, 3 - secondarySlides.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-100 rounded-lg" aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ MOBILE / TABLET: Carousel (below lg) ══════════ */}
      <div
        className="lg:hidden"
        ref={containerRef}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured stories"
      >
        <span ref={liveRegionRef} className="sr-only" aria-live="polite" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full overflow-hidden bg-black rounded-lg shadow-xl">
            {/* ─── Slide wrapper ─────────────────────── */}
            <div
              className="relative w-full"
              style={{ height: "clamp(220px, 50vw, 480px)" }}
            >
              <div
                className="absolute inset-0 flex"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                  transition: "transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {slides.map((slide, idx) => (
                  <div key={slide._id || idx} className="w-full h-full flex-shrink-0 relative">
                    <img
                      src={slide.image}
                      alt={slide.alt || slide.title}
                      className="w-full h-full object-cover"
                      loading={idx === currentIndex ? "eager" : "lazy"}
                      style={{ filter: "brightness(1.05) contrast(1.05)" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/1400x620?text=Image+Unavailable";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
                    <div className="absolute inset-0 bg-black/10" />

                    {/* Text overlay – active only */}
                    {idx === currentIndex && (
                      <div
                        className="absolute left-3 xs:left-4 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-10 text-white"
                        style={{ maxWidth: "min(92%, 480px)" }}
                      >
                        <p
                          className="uppercase text-red-400 font-semibold drop-shadow-lg text-[10px] xs:text-xs sm:text-sm tracking-[2px] sm:tracking-[3px] mb-1 sm:mb-2"
                        >
                          ■ {slide.category}
                        </p>
                        <h1 className="font-extrabold leading-tight drop-shadow-xl line-clamp-3 text-xl xs:text-2xl sm:text-3xl md:text-4xl">
                          {slide.title}
                        </h1>
                        <p className="text-white/95 leading-relaxed line-clamp-2 sm:line-clamp-3 drop-shadow-lg text-xs xs:text-sm sm:text-base mt-2 sm:mt-3">
                          {slide.description}
                        </p>
                        <Link
                          to={slide.link || "/news"}
                          className="inline-flex items-center gap-2 border-2 border-white bg-transparent hover:bg-white hover:text-black uppercase font-semibold whitespace-nowrap shadow-lg text-[10px] xs:text-xs sm:text-sm px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 mt-2 sm:mt-3 transition-colors duration-300"
                        >
                          {slide.buttonText || "Read More"}
                          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                            →
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Slide counter ────────────────────── */}
            <div className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 z-20">
              <span className="text-white/90 text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-wider bg-black/40 backdrop-blur-sm px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">
                {String(currentIndex + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
              </span>
            </div>

            {/* ─── Mobile dots ──────────────────────── */}
            <div className="absolute bottom-2.5 xs:bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex sm:hidden gap-1.5 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === currentIndex}
                  className={`h-1 xs:h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-5 xs:w-6 bg-white" : "w-2 xs:w-3 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ─── Thumbnail rail (tablet only) ────── */}
          <div className="hidden sm:flex gap-0.5 xs:gap-1 sm:gap-1.5 mt-2 md:mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {slides.map((slide, index) => (
              <button
                key={slide._id || index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to: ${slide.title}`}
                aria-current={index === currentIndex}
                className="relative flex-shrink-0 flex items-center gap-1 xs:gap-1.5 sm:gap-2 pr-1 xs:pr-1.5 sm:pr-2 py-1 xs:py-1.5 sm:py-2 text-left border-2 border-transparent hover:border-white/30 transition-colors duration-200"
                style={{ maxWidth: "160px", minWidth: "70px" }}
              >
                <span
                  className="flex-shrink-0 w-6 h-4 xs:w-8 xs:h-6 sm:w-10 sm:h-7 md:w-14 md:h-10 bg-cover bg-center rounded-sm"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                <span className="min-w-0">
                  <span
                    className={`block text-[8px] xs:text-[10px] uppercase tracking-wider font-semibold ${
                      index === currentIndex ? "text-red-500" : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`hidden xs:block text-[10px] sm:text-xs md:text-sm font-medium truncate ${
                      index === currentIndex ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {slide.title}
                  </span>
                </span>
                {index === currentIndex && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
