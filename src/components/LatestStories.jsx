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

// ─────────────────────────────────────────────────────────────
// Skeleton – horizontal list item
// ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="animate-pulse flex flex-col sm:flex-row gap-4 sm:gap-6 py-4 border-b border-gray-100 dark:border-zinc-800 last:border-0">
    <div className="w-full sm:w-48 md:w-56 lg:w-64 aspect-video sm:aspect-square bg-gray-200 dark:bg-zinc-800 relative flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]" />
    </div>
    <div className="flex-1 flex flex-col justify-center space-y-2">
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800" />
      <div className="h-3 w-1/3 bg-gray-200 dark:bg-zinc-800" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Story Row – matches screenshot design
// ─────────────────────────────────────────────────────────────
const StoryRow = React.memo(function StoryRow({ post, isBroken, onImgError, index }) {
  const src = isBroken
    ? FALLBACK_IMG
    : post.images && post.images.length > 0
    ? post.images[0]
    : FALLBACK_IMG;

  const cleanExcerpt = stripHtml(post.excerpt || post.description || "");

  return (
    <li
      className="list-none opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <article className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-4 border-b border-gray-100 dark:border-zinc-800 last:border-0 group">
        {/* Image */}
        <Link
          to={`/news/${post.slug || post._id}`}
          aria-label={`Read story: ${post.title}`}
          className="block overflow-hidden relative flex-shrink-0 w-full sm:w-48 md:w-56 lg:w-64 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
        >
          <div className="aspect-video sm:aspect-square bg-gray-100 dark:bg-zinc-800 overflow-hidden">
            <img
              src={src}
              alt={post.title}
              loading="lazy"
              onError={() => onImgError(post._id)}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
          {/* Optional badges – minimal, like the screenshot */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {isNew(post.createdAt) && (
              <span className="text-[8px] font-bold uppercase tracking-wider bg-green-500 text-white px-1.5 py-0.5">
                New
              </span>
            )}
            {post.category && (
              <span className="text-[8px] font-bold uppercase tracking-wider bg-black/80 text-white px-1.5 py-0.5">
                {post.category}
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          <Link
            to={`/news/${post.slug || post._id}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">
              {post.title}
            </h3>
          </Link>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
            {cleanExcerpt}
          </p>

          <Link
            to={`/news/${post.slug || post._id}`}
            aria-label={`Continue reading: ${post.title}`}
            className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors mt-3 inline-block w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            READ MORE
          </Link>
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

  // ─── Fetch posts ──────────────────────────────────────
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

      const res = await api.get("/api/posts", { params, signal: controller.signal });
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

  // ─── Infinite scroll observer ──────────────────────────
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
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
      className="max-w-7xl mx-auto py-8 sm:py-14 md:py-16 px-3 sm:px-6 bg-white dark:bg-zinc-900"
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
      `}</style>

      {/* ─── Header ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
        <div>
          <p className="uppercase text-red-500 tracking-[3px] sm:tracking-[4px] text-xs sm:text-sm font-bold">
            Browse &amp; Read
          </p>
          <h2
            id="latest-stories-heading"
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mt-1 sm:mt-2 text-black dark:text-white"
          >
            Latest Stories
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Stay up to date with the most recent posts from our writers. Fresh
            perspectives, curated for you.
          </p>
        </div>
        <Link
          to="/news"
          aria-label="View all stories"
          className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors hidden sm:inline-block mt-2 sm:mt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          View All →
        </Link>
      </div>

      {/* ─── Story List (long‑form) ────────────────── */}
      {loading && initialLoad ? (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800">
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
            className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
          <ul className="flex flex-col">
            {posts.map((post, index) => (
              <StoryRow
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
    </section>
  );
};

export default LatestStories;
