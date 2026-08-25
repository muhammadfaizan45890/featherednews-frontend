// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { Link } from "react-router-dom";
// import { toast } from "sonner";
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

// const LatestStories = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [hasMore, setHasMore] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [categories, setCategories] = useState(["All"]);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [initialLoad, setInitialLoad] = useState(true);

//   // ─── Trending posts (first 7 of the fetched posts) ──
//   const [trendingPosts, setTrendingPosts] = useState([]);
//   const [showAllTrending, setShowAllTrending] = useState(false);

//   const displayedTrending = showAllTrending
//     ? trendingPosts
//     : trendingPosts.slice(0, 4);

//   // ─── Fetch posts ─────────────────────────────────────
//   const fetchPosts = useCallback(
//     async (pageNum = 1, append = false) => {
//       try {
//         if (append) {
//           setIsLoadingMore(true);
//         } else {
//           setLoading(true);
//         }
//         setError(null);

//         const params = {
//           page: pageNum,
//           limit: 8,
//           sort: "desc",
//           ...(selectedCategory !== "All" && { category: selectedCategory }),
//         };

//         const res = await api.get("/api/posts", { params });
//         const { data, pagination } = res.data;

//         const allCats = data.map((p) => p.category);
//         setCategories(["All", ...new Set(allCats)]);

//         if (append) {
//           setPosts((prev) => [...prev, ...data]);
//         } else {
//           setPosts(data);
//         }

//         setTrendingPosts(data.slice(0, 7));

//         setTotalPages(pagination.totalPages);
//         setHasMore(pagination.hasMore);
//       } catch (err) {
//         console.error("Fetch posts error:", err);
//         setError(err.response?.data?.message || "Failed to load stories");
//         toast.error("Failed to load stories");
//       } finally {
//         setLoading(false);
//         setIsLoadingMore(false);
//         setInitialLoad(false);
//       }
//     },
//     [selectedCategory]
//   );

//   // ─── Initial load & category changes ──────────────
//   useEffect(() => {
//     setPage(1);
//     setPosts([]);
//     fetchPosts(1, false);
//   }, [selectedCategory, fetchPosts]);

//   // ─── Load More ──────────────────────────────────────
//   const loadMore = () => {
//     if (isLoadingMore || !hasMore) return;
//     const nextPage = page + 1;
//     setPage(nextPage);
//     fetchPosts(nextPage, true);
//   };

//   // ─── Render ──────────────────────────────────────────
//   return (
//     <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6">
//       {/* Heading */}
//       <div className="mb-10 sm:mb-12">
//         <p className="uppercase text-gray-500 tracking-[3px] sm:tracking-[4px] text-xs sm:text-sm">
//           Browse & Read
//         </p>
//         <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-1 sm:mt-2">
//           Latest Stories
//         </h2>
//       </div>

//       {/* ─── Category Filters ────────────────────────── */}
//       <div className="flex flex-wrap gap-2 mb-6">
//         {categories.map((cat) => (
//           <button
//             key={cat}
//             onClick={() => setSelectedCategory(cat)}
//             className={`px-3 py-1.5 text-xs sm:text-sm font-medium border-2 ${
//               selectedCategory === cat
//                 ? "bg-black text-white border-black"
//                 : "bg-white text-gray-700 border-gray-300 hover:border-black"
//             }`}
//           >
//             {cat}
//           </button>
//         ))}
//       </div>

//       {/* ─── Two‑column layout ────────────────────────── */}
//       <div className="flex flex-row gap-4 sm:gap-6 lg:gap-8">
//         {/* ===== LEFT: CUBE GRID ===== */}
//         <div className="flex-1 min-w-0">
//           {loading && initialLoad ? (
//             <div className="flex justify-center py-12">
//               <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
//             </div>
//           ) : error ? (
//             <div className="text-center py-12 text-red-500">{error}</div>
//           ) : posts.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-gray-500">No stories found in this category.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
//               {posts.map((post) => (
//                 <Link
//                   key={post._id}
//                   to={`/news/${post.slug || post._id}`}
//                   className="relative group block"
//                   style={{ aspectRatio: "1 / 1" }}
//                 >
//                   <img
//                     src={post.images && post.images.length > 0 ? post.images[0] : "https://via.placeholder.com/500/350?text=No+Image"}
//                     alt={post.title}
//                     className="absolute inset-0 w-full h-full object-cover"
//                   />
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
//                   <div className="absolute inset-0 p-2 sm:p-3 md:p-4 flex flex-col justify-end text-white">
//                     <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-500 px-1.5 py-0.5 inline-block w-fit mb-1">
//                       {post.category}
//                     </span>
//                     <h3 className="text-[11px] sm:text-sm md:text-base font-bold leading-tight line-clamp-2">
//                       {post.title}
//                     </h3>
//                     <p className="text-[8px] sm:text-[9px] text-gray-300 mt-0.5 line-clamp-1 hidden xs:block">
//                       {new Date(post.createdAt).toLocaleDateString()}
//                     </p>
//                     <span className="mt-1 text-[8px] sm:text-[9px] font-semibold uppercase text-red-400 flex items-center gap-0.5">
//                       Read More
//                       <span>→</span>
//                     </span>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           )}

//           {/* Load More */}
//           {/* <div className="text-center mt-6 sm:mt-8 md:mt-10">
//             {hasMore && !loading && !error && (
//               <button
//                 onClick={loadMore}
//                 disabled={isLoadingMore}
//                 className="border-2 border-black bg-white text-black hover:bg-black hover:text-white px-6 py-2 text-sm sm:text-base font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isLoadingMore ? (
//                   <span className="flex items-center gap-2">
//                     <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Loading...
//                   </span>
//                 ) : (
//                   "More Posts"
//                 )}
//               </button>
//             )}
//             {!hasMore && !loading && !error && posts.length > 0 && (
//               <p className="text-gray-400 text-xs sm:text-sm">No more posts</p>
//             )}
//           </div> */}
//         </div>

//         {/* ===== RIGHT SIDEBAR: TRENDING ===== */}
//         <aside className="w-[30%] min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:w-[28%] xl:w-[25%] flex-shrink-0">
//           <div className="bg-white overflow-hidden border border-gray-100 sticky top-4">
//             <div className="px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 border-b border-gray-200">
//               <span className="text-[9px] sm:text-xs font-bold uppercase text-center tracking-wider text-gray-900">Trending</span>
//               <span className="ml-auto text-[8px] sm:text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
//                 {displayedTrending.length}
//               </span>
//             </div>

//             <div className="p-1.5 sm:p-2 space-y-1 max-h-[500px] overflow-y-auto">
//               {displayedTrending.map((post, idx) => (
//                 <Link
//                   key={post._id}
//                   to={`/news/${post.slug || post._id}`}
//                   className="flex items-start gap-1.5 p-1.5 hover:bg-gray-50 cursor-pointer"
//                 >
//                   <span className="text-[8px] sm:text-[10px] font-bold text-red-500 w-4 sm:w-5 flex-shrink-0 text-right">
//                     #{idx + 1}
//                   </span>
//                   <div className="flex-1 min-w-0">
//                     <h4 className="text-[8px] sm:text-[10px] font-semibold line-clamp-2 text-gray-900">
//                       {post.title}
//                     </h4>
//                     <div className="flex items-center gap-1 mt-0.5 text-[6px] sm:text-[8px] text-gray-500">
//                       <span>{post.category}</span>
//                       <span>•</span>
//                       <span>{new Date(post.createdAt).toLocaleDateString()}</span>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>

//             {trendingPosts.length > 4 && (
//               <div className="p-1.5 border-t border-gray-100">
//                 <button
//                   onClick={() => setShowAllTrending(!showAllTrending)}
//                   className="w-full text-center text-[8px] sm:text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5"
//                 >
//                   {showAllTrending
//                     ? "Show Less"
//                     : `Show More (${trendingPosts.length - 4})`}
//                 </button>
//               </div>
//             )}
//           </div>
//         </aside>
//       </div>
//     </section>
//   );
// };

// export default LatestStories;





import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import API from "../utils/api";

// ─────────────────────────────────────────────────────────────
// API instance
// ─────────────────────────────────────────────────────────────
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

const FALLBACK_IMG = "https://via.placeholder.com/500x500/111111/FFFFFF?text=No+Image";
const MAX_RETRIES = 3;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const isNew = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff < 24 * 60 * 60 * 1000;
};

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────
// Skeleton – responsive: stacked on mobile, row on sm+
// ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex w-full flex-col items-start gap-4 animate-pulse sm:flex-row sm:gap-[24px]">
    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gray-200 dark:bg-zinc-800 sm:aspect-auto sm:h-[170px] sm:w-[215px]">
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]" />
    </div>
    <div className="relative min-w-0 flex-1 sm:pt-[14px]">
      <div className="mb-3 bg-white px-0 py-1 dark:bg-zinc-900 sm:-ml-[62px] sm:mb-[12px] sm:px-[20px] sm:py-[8px]">
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-zinc-800 sm:h-6" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-[9px] gap-y-[4px]">
        <div className="h-[17px] w-16 bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Story Card – same design as original, now fully responsive:
// image sits on top and full-width on mobile, then moves back
// to the original overlapping-title row layout from sm+ up.
// ─────────────────────────────────────────────────────────────
const StoryCard = React.memo(function StoryCard({ post, isBroken, onImgError, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const src = isBroken
    ? FALLBACK_IMG
    : post.images && post.images.length > 0
    ? post.images[0]
    : FALLBACK_IMG;

  const cleanExcerpt = stripHtml(post.excerpt || post.description || "");
  const formattedDate = formatDate(post.createdAt);
  const authorName = post.author?.fullname || post.author?.username || "Admin";
  const commentCount = post.comments?.length || 0;

  return (
    <li
      className="list-none opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <article className="group flex w-full flex-col items-start gap-4 sm:flex-row sm:gap-[24px]">
        {/* Image */}
        <Link
          to={`/news/${post.slug || post._id}`}
          aria-label={`Read story: ${post.title}`}
          className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:aspect-auto sm:h-[170px] sm:w-[215px]"
        >
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-zinc-800" aria-hidden="true" />
          )}
          <img
            src={src}
            alt={post.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgLoaded(true);
              onImgError(post._id);
            }}
            className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Optional "New" badge (small) */}
          {isNew(post.createdAt) && (
            <span className="absolute top-2 left-2 text-[7px] font-bold uppercase tracking-wider bg-green-500 text-white px-1.5 py-0.5">
              New
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="relative min-w-0 flex-1 sm:pt-[14px]">
          {/* Overlapping white title box (only overlaps from sm+, where the image sits beside it) */}
          <div className="mb-3 bg-white px-0 py-1 dark:bg-zinc-900 sm:-ml-[62px] sm:mb-[12px] sm:px-[20px] sm:py-[8px]">
            <Link
              to={`/news/${post.slug || post._id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <h2 className="m-0 max-w-[590px] text-[18px] font-[800] leading-[1.16] tracking-[-0.4px] text-[#151515] dark:text-white sm:text-[20px] sm:leading-[1.12] sm:tracking-[-0.45px] lg:text-[21px] group-hover:text-red-500 transition-colors">
                {post.title}
              </h2>
            </Link>
          </div>

          <p className="mb-[13px] max-w-[515px] text-[12px] font-normal leading-[1.55] text-[#999] dark:text-gray-400 sm:text-[11px] lg:text-[12px] line-clamp-3">
            {cleanExcerpt}
          </p>

          {/* Post meta */}
          <div className="flex flex-wrap items-center gap-x-[9px] gap-y-[4px]">
            {post.category && (
              <span className="inline-flex h-[17px] items-center bg-[#ff4b35] px-[9px] text-[7px] font-bold uppercase tracking-[0.2px] text-white">
                {post.category}
              </span>
            )}

            <span className="text-[8px] font-medium uppercase text-[#aaa] dark:text-gray-500">
              {formattedDate}
            </span>

            <span className="text-[8px] text-[#aaa] dark:text-gray-500">/</span>

            <span className="text-[8px] font-medium uppercase text-[#aaa] dark:text-gray-500">
              BY {authorName}
            </span>

            <span className="text-[8px] text-[#aaa] dark:text-gray-500">/</span>

            <span className="text-[8px] font-medium text-[#aaa] dark:text-gray-500">
              {commentCount}
            </span>
          </div>
        </div>
      </article>
    </li>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const LatestStories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const [brokenImages, setBrokenImages] = useState(() => new Set());

  const abortRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // ─── Online / offline awareness ──────────────────────
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ─── Fetch posts (with retry/backoff on transient failures) ──
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = { page: pageNum, limit: 10, sort: "desc" };

      let attempt = 0;
      let res;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          res = await api.get("/api/posts", { params, signal: controller.signal });
          break;
        } catch (err) {
          const isCanceled =
            axios.isCancel(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED";
          const isServerOrNetworkError = !err.response || err.response.status >= 500;

          if (isCanceled || !isServerOrNetworkError || attempt >= MAX_RETRIES) {
            throw err;
          }
          attempt += 1;
          await sleep(2 ** attempt * 300); // exponential backoff: 600ms, 1200ms, 2400ms
        }
      }

      const { data, pagination } = res.data;

      setPosts((prev) => (append ? [...prev, ...data] : data));
      setHasMore(pagination.hasMore);
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      console.error("Fetch posts error:", err);
      setError(err.response?.data?.message || "Failed to load stories");
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setInitialLoad(false);
    }
  }, []);

  // ─── Initial load ──────────────────────────────
  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, false);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load more ──────────────────────────────────────
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    setPage((prev) => {
      const nextPage = prev + 1;
      fetchPosts(nextPage, true);
      return nextPage;
    });
  }, [fetchPosts]);

  // ─── Infinite scroll observer (responsive rootMargin) ──
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const isSmallViewport =
      typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: isSmallViewport ? "200px" : "400px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleImgError = useCallback((id) => {
    setBrokenImages((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const showEmptyState = useMemo(
    () => !loading && !error && posts.length === 0,
    [loading, error, posts.length]
  );

  return (
    <section
      aria-labelledby="latest-stories-heading"
      className="w-full bg-white dark:bg-zinc-900"
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[fadeInUp_0\\.5s_ease-out_forwards\\],
          .animate-\\[shimmer_1\\.6s_infinite\\],
          .animate-pulse {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[900px] px-[20px] py-[25px] sm:px-[30px]">
        {/* ─── Offline banner ────────────────────────────── */}
        {isOffline && (
          <div
            role="status"
            className="mb-4 border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
          >
            You&apos;re offline. Stories may be out of date.
          </div>
        )}

        {/* ─── Header ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-2">
          <div>
            <p className="uppercase text-red-500 tracking-[3px] text-xs sm:text-sm font-bold">
              Browse &amp; Read
            </p>
            <h2
              id="latest-stories-heading"
              className="text-2xl xs:text-3xl sm:text-4xl font-bold mt-1 text-black dark:text-white"
            >
              Latest Stories
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Stay up to date with the most recent posts from our writers.
            </p>
          </div>
          <Link
            to="/news"
            aria-label="View all stories"
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors self-start sm:self-auto"
          >
            View All →
          </Link>
        </div>

        {/* ─── Story List ────────────────────────────────── */}
        {loading && initialLoad ? (
          <div className="flex flex-col gap-8 sm:gap-[30px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="text-center py-12 border border-dashed border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
          >
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button
              type="button"
              onClick={() => fetchPosts(1, false)}
              aria-label="Retry loading stories"
              className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : showEmptyState ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-zinc-700">
            <p className="text-gray-500 dark:text-gray-400">No stories found.</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-8 sm:gap-[30px]">
              {posts.map((post, index) => (
                <StoryCard
                  key={post._id}
                  post={post}
                  index={index}
                  isBroken={brokenImages.has(post._id)}
                  onImgError={handleImgError}
                />
              ))}
            </ul>

            {/* Infinite-scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
            )}

            {isLoadingMore && (
              <div className="text-center mt-6" role="status" aria-live="polite">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg
                    className="animate-spin h-4 w-4 text-black dark:text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading more...
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default LatestStories;
