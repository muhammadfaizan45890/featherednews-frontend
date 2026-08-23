// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import API from "../utils/api";

// // ─── Helper: strip HTML tags ──────────────────────────
// const stripHtml = (html) => {
//   if (!html) return '';
//   const temp = document.createElement('div');
//   temp.innerHTML = html;
//   return temp.textContent || '';
// };

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

// const HNews = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchPosts = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const res = await api.get('/api/posts', {
//           params: { page: 1, limit: 6, sort: 'desc' }
//         });
//         // No category filter → fetches both news and blogs
//         setPosts(res.data.data || []);
//       } catch (err) {
//         console.error('Error fetching posts:', err);
//         setError(err.response?.data?.message || 'Failed to load stories');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchPosts();
//   }, []);

//   // Split posts: first 2 as featured, next 4 as small
//   const featuredPosts = posts.slice(0, 2);
//   const smallPosts = posts.slice(2, 6);

//   // ─── Loading state ──────────────────────────────────
//   if (loading) {
//     return (
//       <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
//           <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
//           <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Stories</h2>
//         </div>
//         <div className="flex justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
//         </div>
//       </section>
//     );
//   }

//   // ─── Error state ────────────────────────────────────
//   if (error) {
//     return (
//       <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
//           <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
//           <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Stories</h2>
//         </div>
//         <div className="text-center py-12">
//           <p className="text-red-500 text-lg">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition"
//           >
//             Retry
//           </button>
//         </div>
//       </section>
//     );
//   }

//   // ─── No posts ──────────────────────────────────────
//   if (posts.length === 0) {
//     return (
//       <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
//           <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
//           <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Stories</h2>
//         </div>
//         <div className="text-center py-12">
//           <p className="text-gray-500 text-lg">No stories available at the moment.</p>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
//       {/* Heading with accent */}
//       <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
//         <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
//         <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">News</h2>
//       </div>

//       {/* Main grid */}
//       <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
//         {/* Left Side – small news cards (2 columns on md+, 1 on mobile) */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
//           {smallPosts.map((item) => (
//             <Link
//               key={item._id}
//               to={`/news/${item.slug || item._id}`}
//               className="group cursor-pointer block"
//             >
//               <div className="overflow-hidden">
//                 <img
//                   src={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/600x400?text=No+Image'}
//                   alt={item.title}
//                   className="w-full h-48 sm:h-52 md:h-48 lg:h-52 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
//                 />
//               </div>
//               <span className="inline-block uppercase text-[10px] sm:text-xs tracking-[3px] text-red-500 mt-4 font-semibold">
//                 ■ {item.category}
//               </span>
//               <h3 className="text-lg sm:text-xl md:text-2xl font-bold mt-2 group-hover:text-red-500 transition-colors duration-300 leading-tight line-clamp-2">
//                 {item.title}
//               </h3>
//               <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed line-clamp-3">
//                 {stripHtml(item.description)}
//               </p>
//               <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
//                 {new Date(item.createdAt).toLocaleDateString('en-US', {
//                   year: 'numeric',
//                   month: 'short',
//                   day: 'numeric',
//                 })}
//               </p>
//             </Link>
//           ))}
//         </div>

//         {/* Right Side – featured news (stacked vertically) */}
//         <div className="space-y-6 md:space-y-8">
//           {featuredPosts.map((item) => (
//             <Link
//               key={item._id}
//               to={`/news/${item.slug || item._id}`}
//               className="relative group overflow-hidden block"
//             >
//               <img
//                 src={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/1200x400?text=No+Image'}
//                 alt={item.title}
//                 className="w-full h-[240px] sm:h-[280px] md:h-[300px] lg:h-[330px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
//               />
//               {/* Gradient overlay */}
//               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

//               <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 text-white">
//                 <p className="uppercase text-[10px] sm:text-xs tracking-[3px] sm:tracking-[4px] text-red-400 mb-2 sm:mb-3 font-semibold">
//                   ■ {item.category}
//                 </p>
//                 <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2 sm:mb-3 line-clamp-2">
//                   {item.title}
//                 </h2>
//                 <p className="text-gray-200 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3">
//                   {stripHtml(item.description)}
//                 </p>
//                 <p className="text-gray-300 text-xs sm:text-sm mt-3 sm:mt-4">
//                   {new Date(item.createdAt).toLocaleDateString('en-US', {
//                     year: 'numeric',
//                     month: 'short',
//                     day: 'numeric',
//                   })}
//                 </p>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </div>

//       {/* "See All" link */}
//       <div className="mt-10 sm:mt-12 md:mt-14 text-center">
//         <Link
//           to="/news"
//           className="inline-block px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 text-sm sm:text-base font-semibold uppercase tracking-wider"
//         >
//           See All Stories →
//         </Link>
//       </div>
//     </section>
//   );
// };

// export default HNews;








import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye } from "lucide-react";
import API from "../utils/api";

const MAX_POSTS = 20;
const FEATURED_COUNT = 2;
const SMALL_COUNT = 4; // shown alongside the featured hero
const FALLBACK_SQUARE = "https://via.placeholder.com/600x600/111111/FFFFFF?text=No+Image";
const FALLBACK_WIDE = "https://via.placeholder.com/1200x600/111111/FFFFFF?text=No+Image";

// ─── Helper: strip HTML tags ──────────────────────────
const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || "";
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
    month: "short",
    day: "numeric",
  });

// ─── Skeletons ───────────────────────────────────────
const SmallCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="w-full h-48 sm:h-52 md:h-48 lg:h-52 bg-gray-200" />
    <div className="h-2.5 w-16 bg-gray-200 rounded mt-4" />
    <div className="h-4 w-full bg-gray-200 rounded mt-2" />
    <div className="h-4 w-2/3 bg-gray-200 rounded mt-1.5" />
  </div>
);

const FeaturedSkeleton = () => (
  <div className="w-full h-[240px] sm:h-[280px] md:h-[300px] lg:h-[330px] bg-gray-200 animate-pulse" />
);

const MiniCardSkeleton = () => (
  <div className="animate-pulse flex flex-col sm:flex-row gap-4 sm:gap-6">
    <div className="w-full sm:w-40 md:w-48 lg:w-52 xl:w-56 h-44 sm:h-32 md:h-36 lg:h-40 flex-shrink-0 bg-gray-200" />
    <div className="flex-1 min-w-0 py-1">
      <div className="h-4 sm:h-5 w-4/5 bg-gray-200 mt-1" />
      <div className="h-4 sm:h-5 w-3/5 bg-gray-200 mt-2" />
      <div className="h-3 w-full bg-gray-200 mt-4" />
      <div className="h-3 w-full bg-gray-200 mt-1.5" />
      <div className="h-3 w-2/3 bg-gray-200 mt-1.5" />
      <div className="h-4 w-24 bg-gray-200 mt-4" />
    </div>
  </div>
);

const HNews = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [loadedImages, setLoadedImages] = useState(() => new Set());

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
      // No category filter → fetches both news and blogs
      setPosts((res.data.data || []).slice(0, MAX_POSTS));
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      console.error("Error fetching posts:", err);
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
    setBrokenImages((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleImgLoad = (id) => {
    setLoadedImages((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getImageSrc = (post, fallback) => {
    if (brokenImages.has(post._id)) return fallback;
    return post.images && post.images.length > 0 ? post.images[0] : fallback;
  };

  // Split posts: first 2 as featured, next 4 as small, rest as compact grid
  const featuredPosts = useMemo(() => posts.slice(0, FEATURED_COUNT), [posts]);
  const smallPosts = useMemo(
    () => posts.slice(FEATURED_COUNT, FEATURED_COUNT + SMALL_COUNT),
    [posts]
  );
  const morePosts = useMemo(() => posts.slice(FEATURED_COUNT + SMALL_COUNT), [posts]);

  const Heading = ({ label = "News" }) => (
    <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
      <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">{label}</h2>
    </div>
  );

  // ─── Error state ────────────────────────────────────
  if (error) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <Heading label="Latest Stories" />
        <div className="text-center py-12 border border-dashed border-red-200 bg-red-50">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-6 py-2 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors font-semibold uppercase tracking-wider text-sm"
          >
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
        <div className="text-center py-12 border border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">No stories available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .tile-img-loaded {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>

      <Heading label="News" />

      {/* ═══ Primary grid: small cards + featured hero ═══ */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
        {/* Left Side – small news cards (2 columns on md+, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {loading
            ? Array.from({ length: SMALL_COUNT }).map((_, i) => <SmallCardSkeleton key={i} />)
            : smallPosts.map((item) => (
                <Link
                  key={item._id}
                  to={`/news/${item.slug || item._id}`}
                  className="group cursor-pointer block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <div className="overflow-hidden bg-gray-100">
                    <img
                      src={getImageSrc(item, FALLBACK_SQUARE)}
                      alt={item.title}
                      loading="lazy"
                      onError={() => handleImgError(item._id)}
                      className="w-full h-48 sm:h-52 md:h-48 lg:h-52 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <span className="inline-block uppercase text-[10px] sm:text-xs tracking-[3px] text-red-500 mt-4 font-semibold">
                    ■ {item.category}
                  </span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mt-2 group-hover:text-red-500 transition-colors duration-300 leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {stripHtml(item.description)}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
                    {formatDate(item.createdAt)}
                  </p>
                </Link>
              ))}
        </div>

        {/* Right Side – featured news (stacked vertically) */}
        <div className="space-y-6 md:space-y-8">
          {loading
            ? Array.from({ length: FEATURED_COUNT }).map((_, i) => <FeaturedSkeleton key={i} />)
            : featuredPosts.map((item) => (
                <Link
                  key={item._id}
                  to={`/news/${item.slug || item._id}`}
                  className="relative group overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <img
                    src={getImageSrc(item, FALLBACK_WIDE)}
                    alt={item.title}
                    loading="lazy"
                    onError={() => handleImgError(item._id)}
                    className="w-full h-[240px] sm:h-[280px] md:h-[300px] lg:h-[330px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 text-white">
                    <p className="uppercase text-[10px] sm:text-xs tracking-[3px] sm:tracking-[4px] text-red-400 mb-2 sm:mb-3 font-semibold">
                      ■ {item.category}
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
                </Link>
              ))}
        </div>
      </div>

      {/* ═══ More Stories: advanced, fully responsive tile grid ═══ */}
      {(loading || morePosts.length > 0) && (
        <div className="mt-12 sm:mt-16 md:mt-20">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[3px] text-gray-500 whitespace-nowrap">
              More Stories
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={i === 0 ? "pb-6 sm:pb-8" : "py-6 sm:py-8"}>
                    <MiniCardSkeleton />
                  </div>
                ))
              : morePosts.map((item, idx) => (
                  <Link
                    key={item._id}
                    to={`/news/${item.slug || item._id}`}
                    className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                      idx === 0 ? "pb-6 sm:pb-8" : "py-6 sm:py-8"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative w-full sm:w-40 md:w-48 lg:w-52 xl:w-56 h-44 sm:h-32 md:h-36 lg:h-40 flex-shrink-0 overflow-hidden bg-gray-100">
                      {!loadedImages.has(item._id) && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-[shimmer_1.8s_ease-in-out_infinite]" />
                      )}
                      <img
                        src={getImageSrc(item, FALLBACK_SQUARE)}
                        alt={item.title}
                        loading="lazy"
                        onError={() => handleImgError(item._id)}
                        onLoad={() => handleImgLoad(item._id)}
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                          loadedImages.has(item._id) ? "tile-img-loaded opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="text-base sm:text-lg md:text-xl font-bold leading-snug line-clamp-2 text-gray-900 transition-colors duration-300 group-hover:text-red-500">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-2 sm:line-clamp-3 mt-2 sm:mt-3">
                          {stripHtml(item.description)}
                        </p>
                      )}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 mt-3 sm:mt-4">
                        <span className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white px-2.5 py-1">
                          {item.category}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </span>
                        {item.author?.name && (
                          <>
                            <span className="text-gray-300 text-[10px] sm:text-xs">/</span>
                            <span className="text-[10px] sm:text-xs text-gray-400">
                              BY {item.author.name.toUpperCase()}
                            </span>
                          </>
                        )}
                        {typeof item.views === "number" && (
                          <>
                            <span className="text-gray-300 text-[10px] sm:text-xs">/</span>
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {item.views}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HNews;
