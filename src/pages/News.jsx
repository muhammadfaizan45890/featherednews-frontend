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
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  const debounceTimer = useRef(null);

  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    setSelectedCategory(cat);
  }, [searchParams]);

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
        const { data, pagination } = res.data;

        const allCats = data.map((p) => p.category);
        setCategories(["All", ...new Set(allCats)]);

        if (append) {
          setPosts((prev) => [...prev, ...data]);
        } else {
          setPosts(data);
        }

        setTotalPages(pagination.totalPages);
        setHasMore(pagination.hasMore);
      } catch (err) {
        console.error("Fetch posts error:", err);
        setError(err.response?.data?.message || "Failed to load news");
        toast.error("Failed to load news");
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
        setInitialLoad(false);
      }
    },
    [searchTerm, selectedCategory]
  );

  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, false);
  }, [searchTerm, selectedCategory, fetchPosts]);

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-12 sm:mb-16 border-b border-gray-200 pb-6">
        <p className="uppercase text-gray-500 tracking-[4px] text-xs sm:text-sm">
          Stay Informed
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mt-1">
          All News
        </h1>
        <p className="text-gray-600 mt-2 text-base sm:text-lg max-w-2xl">
          Discover the latest stories from around the world.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 sm:mb-12">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search news by title, category, author..."
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border-b-2 border-gray-300 outline-none text-base bg-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchParams({ category: cat === 'All' ? '' : cat });
              }}
              className={`px-4 py-1.5 text-sm font-medium border-2 ${
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
      <p className="text-sm text-gray-500 mb-6">
        Showing {posts.length} results
        {!loading && totalPages > 0 && ` (Page ${page} of ${totalPages})`}
      </p>

      {/* ─── News Grid ──────────────────────────────────── */}
      {loading && initialLoad ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No news found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
              setSearchParams({});
              const input = document.querySelector('input[type="text"]');
              if (input) input.value = "";
            }}
            className="mt-4 text-red-500 font-semibold border-b border-red-500 pb-0.5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
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
                    <span className="flex items-center gap-0.5 sm:gap-1 font-medium text-red-500">
                      Read
                      <span className="inline-block">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && !error && hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-8 py-3 border-2 border-black bg-transparent text-black font-medium text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-black"
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
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </section>
  );
};

export default News;