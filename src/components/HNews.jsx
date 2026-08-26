import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, ArrowRight, Clock } from "lucide-react";
import API from "../utils/api";

// ─── Constants ──────────────────────────────────────────
const MAX_POSTS = 20;
const FEATURED_COUNT = 2;
const SMALL_COUNT = 4;
const FALLBACK_SQUARE =
  "https://via.placeholder.com/600x600/111111/FFFFFF?text=No+Image";
const FALLBACK_WIDE =
  "https://via.placeholder.com/1200x600/111111/FFFFFF?text=No+Image";

// ─── Helpers ────────────────────────────────────────────
const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || "";
};

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

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isNew = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff < 24 * 60 * 60 * 1000;
};

// ─── Skeletons (matching layout) ──────────────────────
const SmallCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-zinc-800" />
    <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded mt-4" />
    <div className="h-5 w-full bg-gray-200 dark:bg-zinc-800 rounded mt-2" />
    <div className="h-5 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded mt-1.5" />
  </div>
);

const FeaturedSkeleton = () => (
  <div className="w-full aspect-[16/9] bg-gray-200 dark:bg-zinc-800 animate-pulse" />
);

const MoreStorySkeleton = () => (
  <div className="animate-pulse py-6 border-b border-gray-100 dark:border-zinc-800 last:border-0">
    <div className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded" />
    <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded mt-3" />
    <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded mt-1.5" />
    <div className="flex items-center gap-4 mt-4">
      <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
      <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────
const HNews = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brokenImages, setBrokenImages] = useState(() => new Set());

  const abortRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/posts", {
        params: { page: 1, limit: MAX_POSTS, sort: "desc" },
        signal: controller.signal,
      });
      setPosts((res.data.data || []).slice(0, MAX_POSTS));
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError") {
        return;
      }
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPosts]);

  const handleImgError = (id) => {
    setBrokenImages((prev) => new Set(prev).add(id));
  };

  const getImageSrc = (post, fallback) => {
    if (brokenImages.has(post._id)) return fallback;
    return post.images?.length > 0 ? post.images[0] : fallback;
  };

  // Memoized splits
  const featuredPosts = useMemo(() => posts.slice(0, FEATURED_COUNT), [posts]);
  const smallPosts = useMemo(
    () => posts.slice(FEATURED_COUNT, FEATURED_COUNT + SMALL_COUNT),
    [posts]
  );
  const morePosts = useMemo(() => posts.slice(FEATURED_COUNT + SMALL_COUNT), [posts]);

  // ─── Heading component ─────────────────────────────
  const Heading = ({ label = "News" }) => (
    <div className="flex items-center justify-between mb-8 sm:mb-10 md:mb-12">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          {label}
        </h2>
      </div>
      <Link
        to="/news"
        className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
      >
        View All →
      </Link>
    </div>
  );

  // ─── Error state ────────────────────────────────────
  if (error) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <Heading label="Latest Stories" />
        <div className="text-center py-12 border border-dashed border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-6 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors font-semibold uppercase tracking-wider text-sm"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ─── Empty state ──────────────────────────────────
  if (!loading && posts.length === 0) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <Heading label="Latest Stories" />
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-zinc-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No stories available at the moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .img-loading {
          background: #f0f0f0;
          background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
          background-size: 200% 100%;
          animation: shimmer 1.5s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: -200% 0; }
        }
      `}</style>

      <Heading label="News" />

      {/* ═══ Primary Grid ═══ */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
        {/* Left – Small Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {loading
            ? Array.from({ length: SMALL_COUNT }).map((_, i) => (
                <SmallCardSkeleton key={i} />
              ))
            : smallPosts.map((item) => (
                <Link
                  key={item._id}
                  to={`/news/${item.slug || item._id}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <div className="relative overflow-hidden bg-gray-100 dark:bg-zinc-800 aspect-[4/3]">
                    <img
                      src={getImageSrc(item, FALLBACK_SQUARE)}
                      alt={item.title}
                      loading="lazy"
                      onError={() => handleImgError(item._id)}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    {isNew(item.createdAt) && (
                      <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-green-500 text-white px-1.5 py-0.5">
                        New
                      </span>
                    )}
                  </div>
                  <span className="inline-block uppercase text-[10px] sm:text-xs tracking-[3px] text-red-500 mt-4 font-semibold">
                    ■ {item.category || "Uncategorized"}
                  </span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mt-2 group-hover:text-red-500 transition-colors duration-300 leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {stripHtml(item.description)}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
                    {formatDate(item.createdAt)}
                  </p>
                </Link>
              ))}
        </div>

        {/* Right – Featured (Stacked) */}
        <div className="space-y-6 md:space-y-8">
          {loading
            ? Array.from({ length: FEATURED_COUNT }).map((_, i) => (
                <FeaturedSkeleton key={i} />
              ))
            : featuredPosts.map((item) => (
                <Link
                  key={item._id}
                  to={`/news/${item.slug || item._id}`}
                  className="relative group overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <div className="aspect-[16/9] bg-gray-100 dark:bg-zinc-800">
                    <img
                      src={getImageSrc(item, FALLBACK_WIDE)}
                      alt={item.title}
                      loading="lazy"
                      onError={() => handleImgError(item._id)}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 text-white">
                    <p className="uppercase text-[10px] sm:text-xs tracking-[3px] sm:tracking-[4px] text-red-400 mb-2 sm:mb-3 font-semibold">
                      ■ {item.category || "Featured"}
                    </p>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2 sm:mb-3 line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {stripHtml(item.description)}
                    </p>
                    <p className="text-gray-300 text-xs sm:text-sm mt-3 sm:mt-4">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  {isNew(item.createdAt) && (
                    <span className="absolute top-3 left-3 text-[8px] font-bold uppercase tracking-wider bg-green-500 text-white px-2 py-0.5">
                      New
                    </span>
                  )}
                </Link>
              ))}
        </div>
      </div>

      {/* ═══ More Stories ═══ */}
      {(loading || morePosts.length > 0) && (
        <div className="mt-12 sm:mt-16 md:mt-20">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[3px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              More Stories
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
          </div>

          <div className="flex flex-col">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <MoreStorySkeleton key={i} />
                ))
              : morePosts.map((item, idx) => (
                  <div
                    key={item._id}
                    className={`py-6 sm:py-8 ${
                      idx < morePosts.length - 1
                        ? "border-b border-gray-100 dark:border-zinc-800"
                        : ""
                    }`}
                  >
                    <Link
                      to={`/news/${item.slug || item._id}`}
                      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-red-500">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-3 line-clamp-3">
                        {stripHtml(item.description)}
                      </p>

                      <hr className="my-4 sm:my-5 border-gray-200 dark:border-zinc-800" />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center text-xs sm:text-sm font-medium text-red-500 transition-colors duration-300 group-hover:text-red-700 dark:group-hover:text-red-400">
                          READ MORE
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                        <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {formatTime(item.createdAt)}
                          <span className="mx-1">·</span>
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                        {item.category && (
                          <span className="uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                        {typeof item.views === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views}
                          </span>
                        )}
                        {isNew(item.createdAt) && (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                            ● New
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
          </div>
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
