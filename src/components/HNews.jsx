import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, ArrowRight, Clock, TrendingUp, RefreshCw } from "lucide-react";
import API from "../utils/api";

const FEATURED_COUNT = 2;
const SMALL_COUNT = 4;
const PAGE_SIZE = 12;
const FALLBACK_SQUARE =
  "https://via.placeholder.com/900x900/111111/FFFFFF?text=No+Image";
const FALLBACK_WIDE =
  "https://via.placeholder.com/1600x900/111111/FFFFFF?text=No+Image";

// ─── Helper: strip HTML tags ──────────────────────────
const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || "";
};

// ─── Helper: reading time from description length ────
const readingTime = (html) => {
  const words = stripHtml(html).trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
};

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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const api = getApiInstance();

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// ─── Simple image component – no transitions, no blur ──
const Image = ({ src, alt, className, onError }) => (
  <div className={`relative overflow-hidden bg-gray-100 ${className || ""}`}>
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      onError={onError}
      className="w-full h-full object-cover"
    />
  </div>
);

// ─── Skeletons (no rounded corners) ──────────────────
const SmallCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="w-full aspect-[4/3] bg-gray-200" />
    <div className="h-2.5 w-16 bg-gray-200 mt-4" />
    <div className="h-4 w-full bg-gray-200 mt-2" />
    <div className="h-4 w-2/3 bg-gray-200 mt-1.5" />
  </div>
);

const FeaturedSkeleton = ({ tall }) => (
  <div
    className={`w-full ${
      tall
        ? "h-[280px] sm:h-[340px] md:h-[380px] lg:h-[420px] 2xl:h-[460px]"
        : "h-[220px] sm:h-[260px] md:h-[280px] lg:h-[300px] 2xl:h-[320px]"
    } bg-gray-200 animate-pulse`}
  />
);

const MoreStorySkeleton = () => (
  <div className="animate-pulse py-6 sm:py-8 border-b border-gray-100 last:border-0">
    <div className="h-5 w-3/4 bg-gray-200" />
    <div className="h-4 w-full bg-gray-200 mt-3" />
    <div className="h-4 w-2/3 bg-gray-200 mt-1.5" />
    <div className="flex items-center gap-4 mt-4">
      <div className="h-3 w-16 bg-gray-200" />
      <div className="h-3 w-24 bg-gray-200" />
    </div>
  </div>
);

// ─── Uniform category badge (light red bg + red text) ──
const CategoryBadge = ({ label }) => (
  <span className="inline-flex items-center uppercase text-[10px] sm:text-xs tracking-[3px] font-bold px-2 py-1 bg-red-100 text-red-600">
    ■ {label}
  </span>
);

// ─── Main Component ──────────────────────────────────
const HNews = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [brokenImages, setBrokenImages] = useState(() => new Set());

  const abortRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchPosts = useCallback(async (pageNum, { append = false } = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      const res = await api.get("/api/posts", {
        params: { page: pageNum, limit: PAGE_SIZE, sort: "desc" },
        signal: controller.signal,
      });
      const incoming = res.data.data || [];
      setPosts((prev) => (append ? [...prev, ...incoming] : incoming));
      setHasMore(incoming.length >= PAGE_SIZE);
    } catch (err) {
      if (
        axios.isCancel(err) ||
        err.name === "CanceledError" ||
        err.code === "ERR_CANCELED"
      ) {
        return;
      }
      console.error("Error fetching posts:", err);
      setError(err.response?.data?.message || "Failed to load stories");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPosts]);

  // Infinite scroll sentinel
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          const next = page + 1;
          setPage(next);
          fetchPosts(next, { append: true });
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [page, hasMore, loadingMore, loading, error, fetchPosts]);

  const handleImgError = (id) => {
    setBrokenImages((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getImageSrc = (post, fallback) => {
    if (brokenImages.has(post._id)) return fallback;
    return post.images && post.images.length > 0 ? post.images[0] : fallback;
  };

  // Split posts
  const featuredPosts = useMemo(() => posts.slice(0, FEATURED_COUNT), [posts]);
  const smallPosts = useMemo(
    () => posts.slice(FEATURED_COUNT, FEATURED_COUNT + SMALL_COUNT),
    [posts]
  );
  const morePosts = useMemo(
    () => posts.slice(FEATURED_COUNT + SMALL_COUNT),
    [posts]
  );

  const Heading = ({ label = "News" }) => (
    <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
      <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
      <h2 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-black tracking-tight">
        {label}
      </h2>
    </div>
  );

  // ─── Error state ────────────────────────────────────
  if (error) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <Heading label="Latest Stories" />
        <div className="text-center py-16 border border-dashed border-red-200 bg-red-50">
          <p className="text-red-500 text-lg mb-5">{error}</p>
          <button
            onClick={() => fetchPosts(1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-semibold uppercase tracking-wider text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ─── No posts ──────────────────────────────────────
  if (!loading && posts.length === 0) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <Heading label="Latest Stories" />
        <div className="text-center py-16 border border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">
            No stories available at the moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <Heading label="News" />

      {/* ═══ Primary grid ═══ */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 2xl:gap-16">
        {/* Left – Small Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 2xl:gap-10">
          {loading
            ? Array.from({ length: SMALL_COUNT }).map((_, i) => (
                <SmallCardSkeleton key={i} />
              ))
            : smallPosts.map((item) => (
                <Link
                  key={item._id}
                  to={`/news/${item.slug || item._id}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <Image
                    src={getImageSrc(item, FALLBACK_SQUARE)}
                    alt={item.title}
                    onError={() => handleImgError(item._id)}
                    className="aspect-[4/3]"
                  />
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {item.category && <CategoryBadge label={item.category} />}
                    {typeof item.views === "number" && item.views > 500 && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-orange-600">
                        <TrendingUp className="w-3 h-3" /> Trending
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl 2xl:text-[1.7rem] font-bold mt-2 group-hover:text-red-500 leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {stripHtml(item.description)}
                  </p>
                  <div className="flex items-center gap-3 text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readingTime(item.description)}
                    </span>
                  </div>
                </Link>
              ))}
        </div>

        {/* Right – Featured (stacked) */}
        <div className="space-y-6 md:space-y-8 2xl:space-y-10">
          {loading
            ? Array.from({ length: FEATURED_COUNT }).map((_, i) => (
                <FeaturedSkeleton key={i} tall={i === 0} />
              ))
            : featuredPosts.map((item, i) => (
                <Link
                  key={item._id}
                  to={`/news/${item.slug || item._id}`}
                  className="relative group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <Image
                    src={getImageSrc(item, FALLBACK_WIDE)}
                    alt={item.title}
                    onError={() => handleImgError(item._id)}
                    className={`${
                      i === 0
                        ? "h-[280px] sm:h-[340px] md:h-[380px] lg:h-[420px] 2xl:h-[460px]"
                        : "h-[220px] sm:h-[260px] md:h-[280px] lg:h-[300px] 2xl:h-[320px]"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 text-white">
                    {item.category && (
                      <p className="uppercase text-[10px] sm:text-xs tracking-[3px] sm:tracking-[4px] text-red-400 mb-2 sm:mb-3 font-bold">
                        ■ {item.category}
                      </p>
                    )}
                    <h2
                      className={`font-black leading-tight mb-2 sm:mb-3 line-clamp-2 ${
                        i === 0
                          ? "text-xl sm:text-2xl md:text-3xl 2xl:text-4xl"
                          : "text-lg sm:text-xl md:text-2xl 2xl:text-3xl"
                      }`}
                    >
                      {item.title}
                    </h2>
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {stripHtml(item.description)}
                    </p>
                    <div className="flex items-center gap-3 text-gray-300 text-xs sm:text-sm mt-3 sm:mt-4">
                      <span>{formatDate(item.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-400" />
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {readingTime(item.description)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>

      {/* ═══ More Stories ═══ */}
      {(loading || morePosts.length > 0) && (
        <div className="mt-12 sm:mt-16 md:mt-20">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[3px] text-gray-500 whitespace-nowrap">
              More Stories
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 2xl:gap-x-16">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <MoreStorySkeleton key={i} />
                ))
              : morePosts.map((item, idx) => (
                  <div
                    key={item._id}
                    className={`py-6 sm:py-8 ${
                      idx < morePosts.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <Link
                      to={`/news/${item.slug || item._id}`}
                      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug text-gray-900 group-hover:text-red-500">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-3 line-clamp-3">
                        {stripHtml(item.description)}
                      </p>

                      <hr className="my-4 sm:my-5 border-gray-200" />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center text-xs sm:text-sm font-medium text-red-500 group-hover:text-red-700">
                          READ MORE
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400">
                          {formatDate(item.createdAt)} |{" "}
                          {formatTime(item.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[10px] sm:text-xs text-gray-400">
                        {item.category && (
                          <CategoryBadge label={item.category} />
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {readingTime(item.description)}
                        </span>
                        {typeof item.views === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!loading && hasMore && (
        <div ref={sentinelRef} className="mt-10 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading more stories…
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default HNews;



















// import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import { Eye, ArrowRight } from "lucide-react";
// import API from "../utils/api";

// const MAX_POSTS = 20;
// const FEATURED_COUNT = 2;
// const SMALL_COUNT = 4;
// const FALLBACK_SQUARE = "https://via.placeholder.com/600x600/111111/FFFFFF?text=No+Image";
// const FALLBACK_WIDE = "https://via.placeholder.com/1200x600/111111/FFFFFF?text=No+Image";

// // ─── Helper: strip HTML tags ──────────────────────────
// const stripHtml = (html) => {
//   if (!html) return "";
//   const temp = document.createElement("div");
//   temp.innerHTML = html;
//   return temp.textContent || "";
// };

// // ─── Helper: reliable API instance ──────────────────
// const getApiInstance = () => {
//   let instance;
//   if (API && typeof API.get === "function") {
//     instance = API;
//   } else {
//     instance = axios.create({
//       baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
//       headers: { "Content-Type": "application/json" },
//     });
//   }
//   instance.interceptors.request.use(
//     (config) => {
//       const token = localStorage.getItem("accessToken");
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
//   return instance;
// };

// const api = getApiInstance();

// const formatDate = (dateStr) =>
//   new Date(dateStr).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });

// const formatTime = (dateStr) =>
//   new Date(dateStr).toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });

// // ─── Skeletons ───────────────────────────────────────
// const SmallCardSkeleton = () => (
//   <div className="animate-pulse">
//     <div className="w-full h-48 sm:h-52 md:h-48 lg:h-52 bg-gray-200" />
//     <div className="h-2.5 w-16 bg-gray-200 rounded mt-4" />
//     <div className="h-4 w-full bg-gray-200 rounded mt-2" />
//     <div className="h-4 w-2/3 bg-gray-200 rounded mt-1.5" />
//   </div>
// );

// const FeaturedSkeleton = () => (
//   <div className="w-full h-[240px] sm:h-[280px] md:h-[300px] lg:h-[330px] bg-gray-200 animate-pulse" />
// );

// const MoreStorySkeleton = () => (
//   <div className="animate-pulse py-6 sm:py-8 border-b border-gray-100 last:border-0">
//     <div className="h-5 w-3/4 bg-gray-200 rounded" />
//     <div className="h-4 w-full bg-gray-200 rounded mt-3" />
//     <div className="h-4 w-2/3 bg-gray-200 rounded mt-1.5" />
//     <div className="flex items-center gap-4 mt-4">
//       <div className="h-3 w-16 bg-gray-200 rounded" />
//       <div className="h-3 w-24 bg-gray-200 rounded" />
//     </div>
//   </div>
// );

// const HNews = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [brokenImages, setBrokenImages] = useState(() => new Set());
//   const [loadedImages, setLoadedImages] = useState(() => new Set());

//   const abortRef = useRef(null);

//   const fetchPosts = useCallback(async () => {
//     if (abortRef.current) abortRef.current.abort();
//     const controller = new AbortController();
//     abortRef.current = controller;

//     try {
//       setLoading(true);
//       setError(null);
//       const res = await api.get("/api/posts", {
//         params: { page: 1, limit: MAX_POSTS, sort: "desc" },
//         signal: controller.signal,
//       });
//       setPosts((res.data.data || []).slice(0, MAX_POSTS));
//     } catch (err) {
//       if (axios.isCancel(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
//         return;
//       }
//       console.error("Error fetching posts:", err);
//       setError(err.response?.data?.message || "Failed to load stories");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPosts();
//     return () => {
//       if (abortRef.current) abortRef.current.abort();
//     };
//   }, [fetchPosts]);

//   const handleImgError = (id) => {
//     setBrokenImages((prev) => {
//       const next = new Set(prev);
//       next.add(id);
//       return next;
//     });
//   };

//   const handleImgLoad = (id) => {
//     setLoadedImages((prev) => {
//       if (prev.has(id)) return prev;
//       const next = new Set(prev);
//       next.add(id);
//       return next;
//     });
//   };

//   const getImageSrc = (post, fallback) => {
//     if (brokenImages.has(post._id)) return fallback;
//     return post.images && post.images.length > 0 ? post.images[0] : fallback;
//   };

//   // Split posts
//   const featuredPosts = useMemo(() => posts.slice(0, FEATURED_COUNT), [posts]);
//   const smallPosts = useMemo(
//     () => posts.slice(FEATURED_COUNT, FEATURED_COUNT + SMALL_COUNT),
//     [posts]
//   );
//   const morePosts = useMemo(() => posts.slice(FEATURED_COUNT + SMALL_COUNT), [posts]);

//   const Heading = ({ label = "News" }) => (
//     <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
//       <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
//       <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">{label}</h2>
//     </div>
//   );

//   // ─── Error state ────────────────────────────────────
//   if (error) {
//     return (
//       <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//         <Heading label="Latest Stories" />
//         <div className="text-center py-12 border border-dashed border-red-200 bg-red-50">
//           <p className="text-red-500 text-lg mb-4">{error}</p>
//           <button
//             onClick={fetchPosts}
//             className="px-6 py-2 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors font-semibold uppercase tracking-wider text-sm"
//           >
//             Retry
//           </button>
//         </div>
//       </section>
//     );
//   }

//   // ─── No posts ──────────────────────────────────────
//   if (!loading && posts.length === 0) {
//     return (
//       <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//         <Heading label="Latest Stories" />
//         <div className="text-center py-12 border border-dashed border-gray-200">
//           <p className="text-gray-500 text-lg">No stories available at the moment.</p>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//       <style>{`
//         @keyframes shimmer {
//           0% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//           100% { background-position: 0% 50%; }
//         }
//         @keyframes fadeIn {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         .tile-img-loaded {
//           animation: fadeIn 0.4s ease-out;
//         }
//       `}</style>

//       <Heading label="News" />

//       {/* ═══ Primary grid: small cards + featured hero ═══ */}
//       <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
//         {/* Left Side – small news cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
//           {loading
//             ? Array.from({ length: SMALL_COUNT }).map((_, i) => <SmallCardSkeleton key={i} />)
//             : smallPosts.map((item) => (
//                 <Link
//                   key={item._id}
//                   to={`/news/${item.slug || item._id}`}
//                   className="group cursor-pointer block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                 >
//                   <div className="overflow-hidden bg-gray-100">
//                     <img
//                       src={getImageSrc(item, FALLBACK_SQUARE)}
//                       alt={item.title}
//                       loading="lazy"
//                       onError={() => handleImgError(item._id)}
//                       className="w-full h-48 sm:h-52 md:h-48 lg:h-52 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
//                     />
//                   </div>
//                   <span className="inline-block uppercase text-[10px] sm:text-xs tracking-[3px] text-red-500 mt-4 font-semibold">
//                     ■ {item.category}
//                   </span>
//                   <h3 className="text-lg sm:text-xl md:text-2xl font-bold mt-2 group-hover:text-red-500 transition-colors duration-300 leading-tight line-clamp-2">
//                     {item.title}
//                   </h3>
//                   <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed line-clamp-3">
//                     {stripHtml(item.description)}
//                   </p>
//                   <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
//                     {formatDate(item.createdAt)}
//                   </p>
//                 </Link>
//               ))}
//         </div>

//         {/* Right Side – featured news (stacked vertically) */}
//         <div className="space-y-6 md:space-y-8">
//           {loading
//             ? Array.from({ length: FEATURED_COUNT }).map((_, i) => <FeaturedSkeleton key={i} />)
//             : featuredPosts.map((item) => (
//                 <Link
//                   key={item._id}
//                   to={`/news/${item.slug || item._id}`}
//                   className="relative group overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                 >
//                   <img
//                     src={getImageSrc(item, FALLBACK_WIDE)}
//                     alt={item.title}
//                     loading="lazy"
//                     onError={() => handleImgError(item._id)}
//                     className="w-full h-[240px] sm:h-[280px] md:h-[300px] lg:h-[330px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
//                   />
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
//                   <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 text-white">
//                     <p className="uppercase text-[10px] sm:text-xs tracking-[3px] sm:tracking-[4px] text-red-400 mb-2 sm:mb-3 font-semibold">
//                       ■ {item.category}
//                     </p>
//                     <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2 sm:mb-3 line-clamp-2">
//                       {item.title}
//                     </h2>
//                     <p className="text-gray-200 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3">
//                       {stripHtml(item.description)}
//                     </p>
//                     <p className="text-gray-300 text-xs sm:text-sm mt-3 sm:mt-4">
//                       {formatDate(item.createdAt)}
//                     </p>
//                   </div>
//                 </Link>
//               ))}
//         </div>
//       </div>

//       {/* ═══ More Stories – redesigned in text‑only blog‑list style ═══ */}
//       {(loading || morePosts.length > 0) && (
//         <div className="mt-12 sm:mt-16 md:mt-20">
//           <div className="flex items-center gap-3 mb-6 sm:mb-8">
//             <div className="h-px flex-1 bg-gray-200" />
//             <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[3px] text-gray-500 whitespace-nowrap">
//               More Stories
//             </span>
//             <div className="h-px flex-1 bg-gray-200" />
//           </div>

//           <div className="flex flex-col">
//             {loading
//               ? Array.from({ length: 5 }).map((_, i) => <MoreStorySkeleton key={i} />)
//               : morePosts.map((item, idx) => (
//                   <div
//                     key={item._id}
//                     className={`py-6 sm:py-8 ${
//                       idx < morePosts.length - 1 ? "border-b border-gray-100" : ""
//                     }`}
//                   >
//                     <Link
//                       to={`/news/${item.slug || item._id}`}
//                       className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                     >
//                       <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug text-gray-900 transition-colors duration-300 group-hover:text-red-500">
//                         {item.title}
//                       </h3>
//                       <p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-3 line-clamp-3">
//                         {stripHtml(item.description)}
//                       </p>

//                       {/* Separator line (---) */}
//                       <hr className="my-4 sm:my-5 border-gray-200" />

//                       <div className="flex flex-wrap items-center justify-between gap-2">
//                         <span className="inline-flex items-center text-xs sm:text-sm font-medium text-red-500 transition-colors duration-300 group-hover:text-red-700">
//                           READ MORE
//                           <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
//                         </span>
//                         <span className="text-xs sm:text-sm text-gray-400">
//                           {formatDate(item.createdAt)} | {formatTime(item.createdAt)}
//                         </span>
//                       </div>

//                       {/* Optional: show category or views if you like */}
//                       <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[10px] sm:text-xs text-gray-400">
//                         {item.category && (
//                           <span className="uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
//                             {item.category}
//                           </span>
//                         )}
//                         {typeof item.views === "number" && (
//                           <span className="inline-flex items-center gap-1">
//                             <Eye className="w-3 h-3" />
//                             {item.views}
//                           </span>
//                         )}
//                       </div>
//                     </Link>
//                   </div>
//                 ))}
//           </div>
//         </div>
//       )}
//     </section>
//   );
// };

// export default HNews;
