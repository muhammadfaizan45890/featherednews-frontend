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





import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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

// ─── Skeleton Card ────────────────────────────────────
const SkeletonCard = () => (
  <div className="relative aspect-square bg-gray-200 animate-pulse rounded-md overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-gray-300/50 via-gray-200/30 to-transparent" />
    <div className="absolute bottom-2 left-2 right-2 space-y-1">
      <div className="h-3 w-16 bg-gray-300 rounded" />
      <div className="h-4 w-full bg-gray-300 rounded" />
      <div className="h-3 w-20 bg-gray-300 rounded" />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────
const LatestStories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [showAllTrending, setShowAllTrending] = useState(false);

  // ─── Ref for infinite scroll sentinel ──────────────
  const observerRef = useRef();
  const sentinelRef = useRef(null);

  // ─── Fetch posts ────────────────────────────────────
  const fetchPosts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = {
          page: pageNum,
          limit: 8,
          sort: "desc",
          ...(selectedCategory !== "All" && { category: selectedCategory }),
        };

        const res = await api.get("/api/posts", { params });
        const { data, pagination } = res.data;

        // Update categories (memoized later)
        const allCats = data.map((p) => p.category);
        setCategories((prev) => {
          const unique = ["All", ...new Set(allCats)];
          return unique.length > prev.length ? unique : prev;
        });

        if (append) {
          setPosts((prev) => [...prev, ...data]);
        } else {
          setPosts(data);
        }

        // First 7 posts become trending
        setTrendingPosts(data.slice(0, 7));

        setHasMore(pagination.hasMore);
      } catch (err) {
        console.error("Fetch posts error:", err);
        setError(err.response?.data?.message || "Failed to load stories");
        toast.error("Failed to load stories");
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory]
  );

  // ─── Initial load & category changes ──────────────
  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, false);
  }, [selectedCategory, fetchPosts]);

  // ─── Infinite scroll setup ─────────────────────────
  useEffect(() => {
    if (loading || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [loading, isLoadingMore, hasMore, page, fetchPosts]);

  // ─── Memoized categories ────────────────────────────
  const uniqueCategories = useMemo(() => categories, [categories]);

  // ─── Display trending ──────────────────────────────
  const displayedTrending = showAllTrending
    ? trendingPosts
    : trendingPosts.slice(0, 4);

  // ─── Helpers ──────────────────────────────────────
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getReadTime = (content) => {
    if (!content) return "1 min read";
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      {/* Heading */}
      <div className="mb-10 sm:mb-12">
        <p className="uppercase text-gray-500 tracking-[3px] sm:tracking-[4px] text-xs sm:text-sm">
          Browse & Read
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-1 sm:mt-2">
          Latest Stories
        </h2>
      </div>

      {/* ─── Category Filters ────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium border-2 transition-all duration-200 ${
              selectedCategory === cat
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Two‑column layout ────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* ===== LEFT: CUBE GRID ===== */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => {
                  setPage(1);
                  setPosts([]);
                  fetchPosts(1, false);
                }}
                className="border border-black px-4 py-2 text-sm hover:bg-black hover:text-white transition"
              >
                Retry
              </button>
            </div>
          ) : loading && posts.length === 0 ? (
            // Skeleton grid
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No stories found in this category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {posts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/news/${post.slug || post._id}`}
                    className="relative group block rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <img
                      src={
                        post.images && post.images.length > 0
                          ? post.images[0]
                          : "https://via.placeholder.com/500x500?text=No+Image"
                      }
                      alt={post.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 p-2 sm:p-3 md:p-4 flex flex-col justify-end text-white">
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-500 px-1.5 py-0.5 inline-block w-fit mb-1">
                        {post.category}
                      </span>
                      <h3 className="text-[11px] sm:text-sm md:text-base font-bold leading-tight line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5 text-[8px] sm:text-[9px] text-gray-300">
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <span>{getReadTime(post.content)}</span>
                      </div>
                      <span className="mt-1 text-[8px] sm:text-[9px] font-semibold uppercase text-red-400 flex items-center gap-0.5 group-hover:gap-1 transition-all">
                        Read More
                        <span>→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Sentinel for infinite scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="h-10 flex justify-center items-center mt-4">
                  {isLoadingMore && (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent" />
                  )}
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="text-center text-gray-400 text-xs sm:text-sm mt-6">
                  You've reached the end
                </p>
              )}
            </>
          )}
        </div>

        {/* ===== RIGHT SIDEBAR: TRENDING ===== */}
        <aside className="w-full md:w-[30%] lg:w-[28%] xl:w-[25%] flex-shrink-0 md:sticky md:top-4 self-start">
          <div className="bg-white overflow-hidden border border-gray-100 rounded-lg shadow-sm">
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 border-b border-gray-200">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-gray-900">
                🔥 Trending
              </span>
              <span className="ml-auto text-[8px] sm:text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {displayedTrending.length}
              </span>
            </div>

            {/* On mobile: horizontal scrollable list */}
            <div className="md:hidden p-1.5 overflow-x-auto flex gap-2 snap-x snap-mandatory scrollbar-hide">
              {displayedTrending.map((post, idx) => (
                <Link
                  key={post._id}
                  to={`/news/${post.slug || post._id}`}
                  className="min-w-[120px] flex-shrink-0 snap-start bg-gray-50 rounded-md p-2 hover:bg-gray-100 transition"
                >
                  <span className="text-[8px] font-bold text-red-500">#{idx + 1}</span>
                  <h4 className="text-[9px] font-semibold line-clamp-2 text-gray-900 mt-1">
                    {post.title}
                  </h4>
                  <p className="text-[7px] text-gray-500 mt-0.5">{formatDate(post.createdAt)}</p>
                </Link>
              ))}
            </div>

            {/* On desktop: vertical list */}
            <div className="hidden md:block p-1.5 sm:p-2 space-y-1 max-h-[500px] overflow-y-auto">
              {displayedTrending.map((post, idx) => (
                <Link
                  key={post._id}
                  to={`/news/${post.slug || post._id}`}
                  className="flex items-start gap-1.5 p-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition"
                >
                  <span className="text-[8px] sm:text-[10px] font-bold text-red-500 w-4 sm:w-5 flex-shrink-0 text-right">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[8px] sm:text-[10px] font-semibold line-clamp-2 text-gray-900">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5 text-[6px] sm:text-[8px] text-gray-500">
                      <span>{post.category}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Toggle show more/less */}
            {trendingPosts.length > 4 && (
              <div className="p-1.5 border-t border-gray-100">
                <button
                  onClick={() => setShowAllTrending(!showAllTrending)}
                  className="w-full text-center text-[8px] sm:text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 rounded transition"
                >
                  {showAllTrending
                    ? "Show Less"
                    : `Show More (${trendingPosts.length - 4})`}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default LatestStories;
