
// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import API from "../utils/api";

// // ─── Helper: reliable API instance ──────────────────
// const getApiInstance = () => {
//   let instance;
//   if (API && typeof API.get === 'function') {
//     instance = API;
//   } else {
//     instance = axios.create({
//       baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
//   instance.interceptors.request.use(
//     (config) => {
//       const token = localStorage.getItem('accessToken');
//       if (token) config.headers.Authorization = `Bearer ${token}`;
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
//   return instance;
// };

// const api = getApiInstance();

// // ─── Fallback static slides ──────────────────────────
// const staticSlides = [
//   {
//     _id: 1,
//     image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400",
//     category: "News • Featured",
//     title: "At daybreak of the fifteenth day of my search",
//     description: "When the amphitheater had cleared I crept stealthily to the top and, as the great excavation lay far from the plaza...",
//     alt: "City architecture",
//     buttonText: "Read More",
//     link: "/news",
//   },
//   {
//     _id: 2,
//     image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1400",
//     category: "Travel • Adventure",
//     title: "Beyond the horizon lies a world of wonder",
//     description: "The journey of a thousand miles begins with a single step. Explore the unknown and discover the beauty that awaits.",
//     alt: "Mountain landscape",
//     buttonText: "Explore Now",
//     link: "/news",
//   },
//   {
//     _id: 3,
//     image: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=1400",
//     category: "Culture • Heritage",
//     title: "Whispers of ancient civilizations",
//     description: "Through the corridors of time, stories of forgotten empires echo, inviting us to uncover their timeless secrets.",
//     alt: "Ancient ruins",
//     buttonText: "Discover More",
//     link: "/news",
//   },
//   {
//     _id: 4,
//     image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400",
//     category: "Nature • Serenity",
//     title: "Where the mountains meet the sky",
//     description: "In the quiet embrace of nature, find peace that transcends the chaos of everyday life and rejuvenates the soul.",
//     alt: "Mountain lake",
//     buttonText: "View Gallery",
//     link: "/news",
//   },
// ];

// const SLIDE_DURATION = 5000;

// const Hero = () => {
//   const [slides, setSlides] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isTransitioning, setIsTransitioning] = useState(false);
//   const [touchStartX, setTouchStartX] = useState(0);
//   const [touchEndX, setTouchEndX] = useState(0);
//   const [progress, setProgress] = useState(0);

//   const autoPlayRef = useRef(null);
//   const progressRef = useRef(null);
//   const transitionTimeoutRef = useRef(null);
//   const containerRef = useRef(null);
//   const liveRegionRef = useRef(null);

//   const totalSlides = slides.length;

//   // ─── Fetch slides ──────────────────────────────────
//   useEffect(() => {
//     const fetchSlides = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get('/api/hero');
//         if (res.data.success && res.data.data.length > 0) {
//           setSlides(res.data.data);
//         } else {
//           setSlides(staticSlides);
//         }
//         setError(null);
//       } catch (err) {
//         console.error('Error fetching hero slides:', err);
//         setError('Failed to load hero slides');
//         setSlides(staticSlides);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSlides();
//   }, []);

//   // ─── Navigation ────────────────────────────────────
//   const goToSlide = useCallback(
//     (index) => {
//       if (isTransitioning || totalSlides === 0) return;
//       const targetIndex = ((index % totalSlides) + totalSlides) % totalSlides;
//       setIsTransitioning(true);
//       setCurrentIndex(targetIndex);
//       setProgress(0);

//       if (transitionTimeoutRef.current) {
//         clearTimeout(transitionTimeoutRef.current);
//       }
//       transitionTimeoutRef.current = setTimeout(() => {
//         setIsTransitioning(false);
//         transitionTimeoutRef.current = null;
//       }, 300);
//     },
//     [isTransitioning, totalSlides]
//   );

//   const nextSlide = useCallback(() => {
//     goToSlide(currentIndex + 1);
//   }, [currentIndex, goToSlide]);

//   const prevSlide = useCallback(() => {
//     goToSlide(currentIndex - 1);
//   }, [currentIndex, goToSlide]);

//   // ─── Auto‑play ────────────────────────────────────────
//   useEffect(() => {
//     if (totalSlides === 0) return;

//     autoPlayRef.current = setInterval(nextSlide, SLIDE_DURATION);
//     return () => {
//       if (autoPlayRef.current) {
//         clearInterval(autoPlayRef.current);
//         autoPlayRef.current = null;
//       }
//     };
//   }, [nextSlide, totalSlides]);

//   // ─── Progress ─────────────────────────────────────────
//   useEffect(() => {
//     if (totalSlides === 0) return;

//     let startTime = Date.now();

//     const updateProgress = () => {
//       const elapsed = Date.now() - startTime;
//       const newProgress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
//       setProgress(newProgress);

//       if (newProgress < 100) {
//         progressRef.current = requestAnimationFrame(updateProgress);
//       } else {
//         progressRef.current = null;
//       }
//     };

//     progressRef.current = requestAnimationFrame(updateProgress);

//     return () => {
//       if (progressRef.current) {
//         cancelAnimationFrame(progressRef.current);
//         progressRef.current = null;
//       }
//     };
//   }, [currentIndex, totalSlides]);

//   // ─── Preload next image ──────────────────────────────
//   useEffect(() => {
//     if (totalSlides === 0) return;
//     const nextIndex = (currentIndex + 1) % totalSlides;
//     const img = new Image();
//     img.src = slides[nextIndex]?.image;
//   }, [currentIndex, slides, totalSlides]);

//   // ─── Screen reader announcements ────────────────────
//   useEffect(() => {
//     if (totalSlides === 0 || !liveRegionRef.current) return;
//     liveRegionRef.current.textContent = `Slide ${currentIndex + 1} of ${totalSlides}: ${slides[currentIndex]?.title || ''}`;
//   }, [currentIndex, slides, totalSlides]);

//   // ─── Keyboard ─────────────────────────────────────────
//   useEffect(() => {
//     if (totalSlides === 0) return;
//     const handleKeyDown = (e) => {
//       if (!containerRef.current) return;
//       if (e.key === "ArrowRight") {
//         e.preventDefault();
//         nextSlide();
//       } else if (e.key === "ArrowLeft") {
//         e.preventDefault();
//         prevSlide();
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [nextSlide, prevSlide, totalSlides]);

//   // ─── Touch ────────────────────────────────────────────
//   const handleTouchStart = (e) => {
//     setTouchStartX(e.touches[0].clientX);
//   };

//   const handleTouchMove = (e) => {
//     setTouchEndX(e.touches[0].clientX);
//   };

//   const handleTouchEnd = () => {
//     const diff = touchStartX - touchEndX;
//     if (Math.abs(diff) > 50) {
//       if (diff > 0) {
//         nextSlide();
//       } else {
//         prevSlide();
//       }
//     }
//     setTouchStartX(0);
//     setTouchEndX(0);
//   };

//   // ─── Cleanup ──────────────────────────────────────────
//   useEffect(() => {
//     return () => {
//       if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
//       if (autoPlayRef.current) clearInterval(autoPlayRef.current);
//       if (progressRef.current) cancelAnimationFrame(progressRef.current);
//     };
//   }, []);

//   // ─── Loading ──────────────────────────────────────────
//   if (loading) {
//     return (
//       <section className="w-full bg-white py-4 sm:py-6 md:py-10">
//         <div className="max-w-7xl mx-auto px-2 sm:px-4">
//           <div className="flex justify-center items-center h-[240px] xs:h-[280px] sm:h-[380px] md:h-[460px] lg:h-[520px] bg-[#2b2b30]">
//             <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
//           </div>
//         </div>
//       </section>
//     );
//   }

//   if (totalSlides === 0) return null;

//   const currentSlide = slides[currentIndex];

//   return (
//     <section
//       className="w-full bg-white py-4 sm:py-6 md:py-10"
//       ref={containerRef}
//       onTouchStart={handleTouchStart}
//       onTouchMove={handleTouchMove}
//       onTouchEnd={handleTouchEnd}
//       role="region"
//       aria-roledescription="carousel"
//       aria-label="Featured stories"
//     >
//       <span ref={liveRegionRef} className="sr-only" aria-live="polite" />

//       <div className="max-w-7xl mx-auto px-2 sm:px-4">
//         <div className="relative overflow-hidden shadow-2xl bg-black group">
//           {/* ─── Main Image with fade transition ────────── */}
//           <div className="relative w-full h-[280px] xs:h-[320px] sm:h-[400px] md:h-[480px] lg:h-[560px] xl:h-[620px]">
//             <img
//               key={currentSlide._id || currentIndex}
//               src={currentSlide.image}
//               alt={currentSlide.alt || currentSlide.title}
//               className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
//               style={{ opacity: isTransitioning ? 0.8 : 1 }}
//               loading="eager"
//               onError={(e) => {
//                 e.target.src = 'https://via.placeholder.com/1400x620?text=Image+Unavailable';
//               }}
//             />
//             <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
//           </div>

//           {/* ─── Progress segments ─────────────────────── */}
//           <div className="absolute top-0 left-0 right-0 flex gap-1 p-2.5 sm:p-3 z-20">
//             {slides.map((_, index) => (
//               <div key={index} className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-white transition-all duration-200"
//                   style={{
//                     width:
//                       index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
//                   }}
//                 />
//               </div>
//             ))}
//           </div>

//           {/* ─── Slide counter ────────────────────────── */}
//           <div className="absolute top-4 sm:top-5 right-3 xs:right-4 lg:right-6 z-20 flex items-center gap-2">
//             <span className="text-white/85 text-[10px] xs:text-xs font-mono tracking-wider bg-black/30 backdrop-blur-sm px-2 py-1">
//               {String(currentIndex + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
//             </span>
//           </div>

//           {/* ─── Content Card ──────────────────────────── */}
//           <div
//             className="absolute left-3 xs:left-4 sm:left-6 md:left-10 lg:left-14
//                        top-1/2 -translate-y-1/2
//                        max-w-[calc(100%-24px)] xs:max-w-[280px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[480px] xl:max-w-[540px]
//                        w-auto
//                        p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10
//                        bg-white/95 backdrop-blur-sm shadow-2xl"
//           >
//             <p className="uppercase text-[8px] xs:text-[10px] sm:text-xs tracking-[2px] xs:tracking-[3px] sm:tracking-[4px] text-red-500 font-semibold mb-1 xs:mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
//               ■ {currentSlide.category}
//             </p>

//             <h1 className="text-sm xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight text-gray-900 line-clamp-3">
//               {currentSlide.title}
//             </h1>

//             <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600 mt-1 xs:mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-4">
//               {currentSlide.description}
//             </p>

//             <Link
//               to={currentSlide.link || "/news"}
//               className="mt-2 xs:mt-2.5 sm:mt-3 md:mt-4 lg:mt-6
//                          inline-flex items-center gap-2
//                          px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8
//                          py-1.5 xs:py-2 sm:py-2 md:py-2.5 lg:py-3
//                          border-2 border-black
//                          hover:bg-black hover:text-white
//                          uppercase text-[8px] xs:text-[10px] sm:text-xs md:text-sm
//                          tracking-wider font-semibold
//                          whitespace-nowrap"
//             >
//               {currentSlide.buttonText || "Read More"}
//               <span className="text-base">→</span>
//             </Link>
//           </div>

//           {/* ─── Mobile dots (kept for quick navigation) ── */}
//           <div className="absolute bottom-3 xs:bottom-4 left-1/2 -translate-x-1/2 flex sm:hidden gap-1.5 xs:gap-2 z-20">
//             {slides.map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => goToSlide(index)}
//                 aria-label={`Go to slide ${index + 1}`}
//                 aria-current={index === currentIndex}
//                 className={`h-1 xs:h-1.5 rounded-full transition-all ${
//                   index === currentIndex ? "w-5 xs:w-6 bg-white" : "w-2 xs:w-3 bg-white/40"
//                 }`}
//               />
//             ))}
//           </div>
//         </div>

//         {/* ─── Thumbnail rail (visible on all screen sizes) ── */}
//         <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 mt-2 md:mt-3 overflow-x-auto pb-1">
//           {slides.map((slide, index) => (
//             <button
//               key={slide._id || index}
//               onClick={() => goToSlide(index)}
//               aria-label={`Go to: ${slide.title}`}
//               aria-current={index === currentIndex}
//               className={`flex-shrink-0 flex items-center gap-1.5 xs:gap-2 pr-2 xs:pr-3 border-b-2 py-1.5 xs:py-2 text-left transition-all ${
//                 index === currentIndex ? "border-red-500" : "border-transparent hover:border-gray-300"
//               }`}
//               style={{ maxWidth: "140px" }}
//             >
//               <span
//                 className="flex-shrink-0 w-8 h-6 xs:w-10 xs:h-7 sm:w-12 sm:h-9 md:w-14 md:h-10 bg-cover bg-center"
//                 style={{ backgroundImage: `url(${slide.image})` }}
//               />
//               <span className="min-w-0">
//                 <span
//                   className={`block text-[8px] xs:text-[10px] uppercase tracking-wider font-semibold ${
//                     index === currentIndex ? "text-red-500" : "text-gray-400"
//                   }`}
//                 >
//                   {String(index + 1).padStart(2, "0")}
//                 </span>
//                 <span className="hidden xs:block text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 truncate">
//                   {slide.title}
//                 </span>
//               </span>
//             </button>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Hero;








import React, { useState, useEffect, useRef, useCallback } from "react";
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
];

const SLIDE_DURATION = 3000;
const INPUT_LOCK_MS = 150;

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

  // ─── Navigation ────────────────────────────────────
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

  // ─── Auto-play ─────────────────────────────────────
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

  // ─── Screen reader ──────────────────────────────
  useEffect(() => {
    if (totalSlides === 0 || !liveRegionRef.current) return;
    liveRegionRef.current.textContent = `Slide ${currentIndex + 1} of ${totalSlides}: ${
      slides[currentIndex]?.title || ""
    }`;
  }, [currentIndex, slides, totalSlides]);

  // ─── Keyboard ─────────────────────────────────────
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

  // ─── Touch ──────────────────────────────────────
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

  // ─── Pause on hover / focus ─────────────────────
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

  // ─── Loading ─────────────────────────────────────
  if (loading) {
    return (
      <section className="w-full bg-white py-3 xs:py-4 sm:py-6 md:py-8 lg:py-10">
        <div className="w-full max-w-[1800px] mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
          <div
            className="w-full bg-[#2b2b30] flex items-center justify-center"
            style={{ height: "clamp(200px, 35vw, 480px)" }}
          >
            <span className="text-white/70 text-xs xs:text-sm sm:text-base tracking-wide uppercase">
              Loading stories…
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (totalSlides === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="w-full bg-white py-3 xs:py-4 sm:py-6 md:py-8 lg:py-10 overflow-hidden"
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

      <div className="w-full max-w-[1800px] mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="relative w-full overflow-hidden shadow-2xl bg-black group">
          {/* ─── Image ─────────────────────────────────── */}
          <div
            className="relative w-full"
            style={{ height: "clamp(200px, 35vw, 480px)" }}
          >
            <img
              key={currentSlide._id || currentIndex}
              src={currentSlide.image}
              alt={currentSlide.alt || currentSlide.title}
              className="w-full h-full object-cover"
              loading="eager"
              style={{ filter: "brightness(1.05) contrast(1.05)" }}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/1400x620?text=Image+Unavailable";
              }}
            />

            {/* ─── Gradient overlays ────────────────── */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* ─── Slide counter ────────────────────────── */}
          <div className="absolute top-2 xs:top-3 sm:top-4 md:top-5 right-2 xs:right-3 sm:right-4 lg:right-6 z-20">
            <span className="text-white/90 text-[9px] xs:text-[10px] sm:text-xs font-mono tracking-wider bg-black/40 backdrop-blur-sm px-1.5 xs:px-2 py-0.5 xs:py-1 rounded">
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(totalSlides).padStart(2, "0")}
            </span>
          </div>

          {/* ─── Text overlay – left, vertically centered ── */}
          <div
            className="absolute left-2.5 xs:left-3 sm:left-5 md:left-8 lg:left-12 xl:left-16 top-1/2 -translate-y-1/2 z-10 text-white"
            style={{ maxWidth: "min(92%, 560px)" }}
          >
            <p
              className="uppercase text-red-400 font-semibold drop-shadow-lg"
              style={{
                fontSize: "clamp(0.55rem, 1.4vw, 0.8rem)",
                letterSpacing: "clamp(1px, 0.4vw, 4px)",
                marginBottom: "clamp(2px, 0.8vw, 12px)",
              }}
            >
              ■ {currentSlide.category}
            </p>

            <h1
              className="font-extrabold leading-tight drop-shadow-xl line-clamp-3"
              style={{ fontSize: "clamp(1rem, 3.6vw, 2.8rem)" }}
            >
              {currentSlide.title}
            </h1>

            <p
              className="text-white/95 leading-relaxed line-clamp-2 sm:line-clamp-3 drop-shadow-lg"
              style={{
                fontSize: "clamp(0.65rem, 1.4vw, 0.95rem)",
                marginTop: "clamp(4px, 1vw, 14px)",
              }}
            >
              {currentSlide.description}
            </p>

            <Link
              to={currentSlide.link || "/news"}
              className="inline-flex items-center gap-2 border-2 border-white bg-transparent hover:bg-white hover:text-black uppercase font-semibold whitespace-nowrap shadow-lg"
              style={{
                marginTop: "clamp(6px, 1.4vw, 18px)",
                padding: "clamp(6px, 1vw, 12px) clamp(12px, 2vw, 26px)",
                fontSize: "clamp(0.55rem, 1.1vw, 0.85rem)",
                letterSpacing: "1px",
              }}
            >
              {currentSlide.buttonText || "Read More"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* ─── Mobile dots ──────────────────────────── */}
          <div className="absolute bottom-2.5 xs:bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex sm:hidden gap-1.5 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex}
                className={`h-1 xs:h-1.5 rounded-full ${
                  index === currentIndex
                    ? "w-5 xs:w-6 bg-white"
                    : "w-2 xs:w-3 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ─── Thumbnail rail ────────────────────────── */}
        <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 mt-2 md:mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {slides.map((slide, index) => (
            <button
              key={slide._id || index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to: ${slide.title}`}
              aria-current={index === currentIndex}
              className="relative flex-shrink-0 flex items-center gap-1.5 xs:gap-2 pr-2 xs:pr-3 py-1.5 xs:py-2 text-left border-2 border-transparent"
              style={{ maxWidth: "160px", minWidth: "88px" }}
            >
              <span
                className="flex-shrink-0 w-7 h-5 xs:w-9 xs:h-6 sm:w-11 sm:h-8 md:w-14 md:h-10 lg:w-16 lg:h-12 bg-cover bg-center rounded"
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
                    index === currentIndex
                      ? "text-black dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {slide.title}
                </span>
              </span>
              {index === currentIndex && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
