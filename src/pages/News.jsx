import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import API from "../utils/api";

// ─── Helper: strip HTML tags ──────────────────────────
const stripHtml = (html) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || '';
};

// ─── Helper: create a reliable API instance ──────────
const getApiInstance = () => {
  let instance;
  if (API && typeof API.get === 'function') {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'featherednews-backend-production.up.railway.app',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

const api = getApiInstance();

const News = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  const debounceTimer = useRef(null);
  const observerTarget = useRef(null);
  const loadMoreTriggered = useRef(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    setSelectedCategory(cat);
  }, [searchParams]);

  // ─── Fetch the FULL category list once, independent of ──
  // ─── pagination/search/selected filter, so "All" chips ──
  // ─── never shrink or flicker based on the current page. ─
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        // Ask for a large page of unfiltered posts purely to
        // derive the distinct set of categories. If the backend
        // exposes a dedicated categories endpoint, swap this for
        // that call instead (e.g. api.get('/api/posts/categories')).
        const res = await api.get("/api/posts", {
          params: { page: 1, limit: 100, sort: "desc" },
        });
        const data = res?.data?.data || [];
        const allCats = data
          .map((p) => p?.category)
          .filter((c) => typeof c === 'string' && c.trim().length > 0);
        setCategories(["All", ...new Set(allCats)]);
      } catch (err) {
        console.error("Fetch categories error:", err);
        // Non-fatal: keep "All" only, don't block the page.
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
          limit: 6,
          sort: "desc",
          ...(searchTerm && { search: searchTerm }),
          ...(selectedCategory !== "All" && { category: selectedCategory }),
        };

        const res = await api.get("/api/posts", { params });
        const data = res?.data?.data || [];
        const pagination = res?.data?.pagination || {};

        if (append) {
          setPosts((prev) => [...prev, ...data]);
        } else {
          setPosts(data);
        }

        setTotalPages(pagination.totalPages || 1);
        setHasMore(Boolean(pagination.hasMore));
      } catch (err) {
        console.error("Fetch posts error:", err);
        setError(err.response?.data?.message || "Failed to load news");
        toast.error("Failed to load news");
        if (!append) setPosts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
        setInitialLoad(false);
        loadMoreTriggered.current = false;
      }
    },
    [searchTerm, selectedCategory]
  );

  useEffect(() => {
    setPage(1);
    setPosts([]);
    setHasMore(false);
    loadMoreTriggered.current = false;
    fetchPosts(1, false);
  }, [searchTerm, selectedCategory, fetchPosts]);

  // ─── Infinite Scroll with Intersection Observer ────
  useEffect(() => {
    const currentTarget = observerTarget.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loadMoreTriggered.current) {
          loadMoreTriggered.current = true;
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, page, fetchPosts]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSearchParams({});
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  // ─── Skeleton Loader ────────────────────────────────
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="relative overflow-hidden bg-gray-200">
        <div className="w-full h-32 sm:h-44 lg:h-56 bg-gray-300" />
      </div>
      <div className="mt-2 sm:mt-4 space-y-2">
        <div className="h-4 sm:h-6 bg-gray-300 rounded w-3/4" />
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-full" />
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex items-center justify-between mt-2 sm:mt-3 pt-1 sm:pt-3 border-t border-gray-100">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto py-10 sm:py-16 md:py-20 px-3 xs:px-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 sm:mb-16 border-b border-gray-200 pb-5 sm:pb-6">
        <p className="uppercase text-gray-500 tracking-[3px] sm:tracking-[4px] text-[11px] sm:text-sm">
          Stay Informed
        </p>
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mt-1">
          All News
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg max-w-2xl">
          Discover the latest stories from around the world.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 mb-8 sm:mb-12">
        <div className="w-full">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search news by title, category, author..."
            onChange={handleSearchChange}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-gray-300 outline-none text-sm sm:text-base bg-transparent"
          />
        </div>

        {/* Category chips: horizontally scrollable on mobile so a long
            category list never breaks layout or gets clipped */}
        <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-thin">
          {categoriesLoading && categories.length === 1
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-20 flex-shrink-0 bg-gray-200 rounded animate-pulse"
                />
              ))
            : categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchParams({ category: cat === 'All' ? '' : cat });
                  }}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium border-2 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === cat
                      ? "border-black bg-black text-white"
                      : "border-gray-300 text-gray-700 hover:border-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
        </div>
      </div>

      {/* Results Count */}
      {!loading && posts.length > 0 && (
        <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
          Showing {posts.length} results
          {totalPages > 0 && ` (Page ${page} of ${totalPages})`}
        </p>
      )}

      {/* ─── News Grid ──────────────────────────────────── */}
      {loading && initialLoad ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
          <button
            onClick={() => fetchPosts(1, false)}
            className="mt-4 text-sm font-semibold border-b border-red-500 pb-0.5"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base sm:text-lg">No news found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-red-500 font-semibold border-b border-red-500 pb-0.5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((item) => (
              <article
                key={item._id}
                className="group border-b border-gray-200 pb-4 sm:pb-6 last:border-0"
              >
                <Link to={`/news/${item.slug || item._id}`} className="block">
                  <div className="relative overflow-hidden bg-gray-100">
                    <img
                      src={item.images && item.images.length > 0 ? item.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
                      alt={item.title}
                      className="w-full h-32 sm:h-44 lg:h-56 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/600x400?text=No+Image";
                      }}
                    />
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 sm:px-2 sm:py-1">
                      {item.category}
                    </span>
                  </div>

                  <div className="mt-2 sm:mt-4">
                    <h2 className="text-sm sm:text-lg lg:text-xl font-bold leading-tight group-hover:text-red-500 line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-gray-600 text-[10px] sm:text-sm leading-relaxed mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                      {stripHtml(item.description)}
                    </p>
                    <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-500 mt-2 sm:mt-3 pt-1 sm:pt-3 border-t border-gray-100">
                      <span className="truncate max-w-[50%] sm:max-w-[60%]">
                        {item.authorName || item.author?.fullname || "Unknown"}
                      </span>
                      <span className="flex items-center gap-0.5 sm:gap-1 font-medium text-red-500 flex-shrink-0">
                        Read
                        <span className="inline-block">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* ─── Loading More Indicator ────────────────── */}
          {isLoadingMore && (
            <div className="flex justify-center py-8 mt-4">
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                <span className="text-sm text-gray-600">Loading more news...</span>
              </div>
            </div>
          )}

          {/* ─── Intersection Observer Target ──────────── */}
          {hasMore && (
            <div
              ref={observerTarget}
              className="h-4 w-full pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* ─── End of Results Message ────────────────── */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center mt-12 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">You've reached the end of the news feed</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default News;

























// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { Link, useSearchParams } from "react-router-dom";
// import { toast } from "sonner";
// import axios from "axios";
// import API from "../utils/api";

// // ─── Helper: strip HTML tags ──────────────────────────
// const stripHtml = (html) => {
//   if (!html) return '';
//   const temp = document.createElement('div');
//   temp.innerHTML = html;
//   return temp.textContent || '';
// };

// // ─── Helper: create a reliable API instance ──────────
// const getApiInstance = () => {
//   let instance;
//   if (API && typeof API.get === 'function') {
//     instance = API;
//   } else {
//     instance = axios.create({
//       baseURL: import.meta.env.VITE_API_URL || 'featherednews-backend-production.up.railway.app',
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

// const News = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [hasMore, setHasMore] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [categories, setCategories] = useState(["All"]);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [initialLoad, setInitialLoad] = useState(true);

//   const [searchParams, setSearchParams] = useSearchParams();

//   const debounceTimer = useRef(null);
//   const observerTarget = useRef(null);
//   const loadMoreTriggered = useRef(false);

//   useEffect(() => {
//     const cat = searchParams.get('category') || 'All';
//     setSelectedCategory(cat);
//   }, [searchParams]);

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
//           limit: 6,
//           sort: "desc",
//           ...(searchTerm && { search: searchTerm }),
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

//         setTotalPages(pagination.totalPages);
//         setHasMore(pagination.hasMore);
//       } catch (err) {
//         console.error("Fetch posts error:", err);
//         setError(err.response?.data?.message || "Failed to load news");
//         toast.error("Failed to load news");
//       } finally {
//         setLoading(false);
//         setIsLoadingMore(false);
//         setInitialLoad(false);
//         loadMoreTriggered.current = false;
//       }
//     },
//     [searchTerm, selectedCategory]
//   );

//   useEffect(() => {
//     setPage(1);
//     setPosts([]);
//     setHasMore(false);
//     loadMoreTriggered.current = false;
//     fetchPosts(1, false);
//   }, [searchTerm, selectedCategory, fetchPosts]);

//   // ─── Infinite Scroll with Intersection Observer ────
//   useEffect(() => {
//     const currentTarget = observerTarget.current;
    
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loadMoreTriggered.current) {
//           loadMoreTriggered.current = true;
//           const nextPage = page + 1;
//           setPage(nextPage);
//           fetchPosts(nextPage, true);
//         }
//       },
//       {
//         root: null,
//         rootMargin: '200px',
//         threshold: 0.1,
//       }
//     );

//     if (currentTarget) {
//       observer.observe(currentTarget);
//     }

//     return () => {
//       if (currentTarget) {
//         observer.unobserve(currentTarget);
//       }
//     };
//   }, [hasMore, isLoadingMore, page, fetchPosts]);

//   const handleSearchChange = (e) => {
//     const value = e.target.value;
//     if (debounceTimer.current) {
//       clearTimeout(debounceTimer.current);
//     }
//     debounceTimer.current = setTimeout(() => {
//       setSearchTerm(value);
//     }, 300);
//   };

//   // ─── Skeleton Loader ────────────────────────────────
//   const SkeletonCard = () => (
//     <div className="animate-pulse">
//       <div className="relative overflow-hidden bg-gray-200">
//         <div className="w-full h-32 sm:h-44 lg:h-56 bg-gray-300" />
//       </div>
//       <div className="mt-2 sm:mt-4 space-y-2">
//         <div className="h-4 sm:h-6 bg-gray-300 rounded w-3/4" />
//         <div className="h-3 sm:h-4 bg-gray-200 rounded w-full" />
//         <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3" />
//         <div className="flex items-center justify-between mt-2 sm:mt-3 pt-1 sm:pt-3 border-t border-gray-100">
//           <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3" />
//           <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4" />
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6">
//       {/* Page Header */}
//       <div className="mb-12 sm:mb-16 border-b border-gray-200 pb-6">
//         <p className="uppercase text-gray-500 tracking-[4px] text-xs sm:text-sm">
//           Stay Informed
//         </p>
//         <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mt-1">
//           All News
//         </h1>
//         <p className="text-gray-600 mt-2 text-base sm:text-lg max-w-2xl">
//           Discover the latest stories from around the world.
//         </p>
//       </div>

//       {/* Search & Filter Bar */}
//       <div className="flex flex-col sm:flex-row gap-4 mb-10 sm:mb-12">
//         <div className="flex-1">
//           <input
//             type="text"
//             placeholder="Search news by title, category, author..."
//             onChange={handleSearchChange}
//             className="w-full px-4 py-3 border-b-2 border-gray-300 outline-none text-base bg-transparent"
//           />
//         </div>
//         <div className="flex flex-wrap gap-2">
//           {categories.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => {
//                 setSelectedCategory(cat);
//                 setSearchParams({ category: cat === 'All' ? '' : cat });
//               }}
//               className={`px-4 py-1.5 text-sm font-medium border-2 ${
//                 selectedCategory === cat
//                   ? "border-black bg-black text-white"
//                   : "border-gray-300 text-gray-700 hover:border-black"
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Results Count */}
//       {!loading && posts.length > 0 && (
//         <p className="text-sm text-gray-500 mb-6">
//           Showing {posts.length} results
//           {totalPages > 0 && ` (Page ${page} of ${totalPages})`}
//         </p>
//       )}

//       {/* ─── News Grid ──────────────────────────────────── */}
//       {loading && initialLoad ? (
//         <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
//           {[...Array(6)].map((_, i) => (
//             <SkeletonCard key={i} />
//           ))}
//         </div>
//       ) : error ? (
//         <div className="text-center py-12 text-red-500">{error}</div>
//       ) : posts.length === 0 ? (
//         <div className="text-center py-12">
//           <p className="text-gray-500 text-lg">No news found matching your criteria.</p>
//           <button
//             onClick={() => {
//               setSearchTerm("");
//               setSelectedCategory("All");
//               setSearchParams({});
//               const input = document.querySelector('input[type="text"]');
//               if (input) input.value = "";
//             }}
//             className="mt-4 text-red-500 font-semibold border-b border-red-500 pb-0.5"
//           >
//             Clear filters
//           </button>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
//             {posts.map((item) => (
//               <article
//                 key={item._id}
//                 className="group border-b border-gray-200 pb-4 sm:pb-6 last:border-0"
//               >
//                 <Link to={`/news/${item.slug || item._id}`} className="block">
//                   <div className="relative overflow-hidden bg-gray-100">
//                     <img
//                       src={item.images && item.images.length > 0 ? item.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
//                       alt={item.title}
//                       className="w-full h-32 sm:h-44 lg:h-56 object-cover"
//                     />
//                     <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 sm:px-2 sm:py-1">
//                       {item.category}
//                     </span>
//                   </div>

//                   <div className="mt-2 sm:mt-4">
//                     <h2 className="text-sm sm:text-lg lg:text-xl font-bold leading-tight group-hover:text-red-500 line-clamp-2">
//                       {item.title}
//                     </h2>
//                     <p className="text-gray-600 text-[10px] sm:text-sm leading-relaxed mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-3">
//                       {stripHtml(item.description)}
//                     </p>
//                     <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-500 mt-2 sm:mt-3 pt-1 sm:pt-3 border-t border-gray-100">
//                       <span className="truncate max-w-[50%] sm:max-w-[60%]">
//                         {item.authorName || item.author?.fullname || "Unknown"}
//                       </span>
//                       <span className="flex items-center gap-0.5 sm:gap-1 font-medium text-red-500">
//                         Read
//                         <span className="inline-block">→</span>
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               </article>
//             ))}
//           </div>

//           {/* ─── Loading More Indicator ────────────────── */}
//           {isLoadingMore && (
//             <div className="flex justify-center py-8 mt-4">
//               <div className="flex items-center gap-3">
//                 <svg
//                   className="animate-spin h-5 w-5 text-black"
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                   />
//                 </svg>
//                 <span className="text-sm text-gray-600">Loading more news...</span>
//               </div>
//             </div>
//           )}

//           {/* ─── Intersection Observer Target ──────────── */}
//           {hasMore && (
//             <div 
//               ref={observerTarget} 
//               className="h-4 w-full pointer-events-none"
//               aria-hidden="true"
//             />
//           )}

//           {/* ─── End of Results Message ────────────────── */}
//           {!hasMore && posts.length > 0 && (
//             <div className="text-center mt-12 pt-4 border-t border-gray-200">
//               <p className="text-sm text-gray-500">You've reached the end of the news feed</p>
//             </div>
//           )}
//         </>
//       )}
//     </section>
//   );
// };

// export default News;
