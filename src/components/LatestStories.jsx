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

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
};

// ─────────────────────────────────────────────────────────────
// Responsive Skeleton
// ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex flex-col md:flex-row w-full items-start gap-4 md:gap-6 animate-pulse">
    {/* Image skeleton – full width on mobile, fixed on md+ */}
    <div className="relative w-full md:w-[215px] aspect-[4/3] md:aspect-auto md:h-[170px] shrink-0 overflow-hidden bg-gray-200 dark:bg-zinc-800">
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.6s_infinite]" />
    </div>
    <div className="relative min-w-0 flex-1 pt-2 md:pt-[14px]">
      {/* Title placeholder – negative margin only on md+ */}
      <div className="md:-ml-[62px] mb-3 md:mb-[12px] bg-white dark:bg-zinc-900 px-4 md:px-[20px] py-2 md:py-[8px]">
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="h-[17px] w-16 bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Story Card – responsive version of the original design
// ─────────────────────────────────────────────────────────────
const StoryCard = React.memo(function StoryCard({ post, isBroken, onImgError, index }) {
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
      <article className="group flex flex-col md:flex-row w-full items-start gap-4 md:gap-6">
        {/* Image – full width on mobile, fixed on md+ */}
        <Link
          to={`/news/${post.slug || post._id}`}
          aria-label={`Read story: ${post.title}`}
          className="relative w-full md:w-[215px] aspect-[4/3] md:aspect-auto md:h-[170px] shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <img
            src={src}
            alt={post.title}
            loading="lazy"
            onError={() => onImgError(post._id)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {isNew(post.createdAt) && (
            <span className="absolute top-2 left-2 text-[7px] md:text-[8px] font-bold uppercase tracking-wider bg-green-500 text-white px-1.5 py-0.5">
              New
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="relative min-w-0 flex-1 pt-1 md:pt-[14px]">
          {/* Overlapping white title box – only on md+ */}
          <div className="md:-ml-[62px] mb-2 md:mb-[12px] bg-white dark:bg-zinc-900 px-3 md:px-[20px] py-1.5 md:py-[8px]">
            <Link
              to={`/news/${post.slug || post._id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <h2 className="text-base sm:text-lg md:text-[20px] lg:text-[21px] font-extrabold leading-tight md:leading-[1.12] tracking-tight md:tracking-[-0.45px] text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">
                {post.title}
              </h2>
            </Link>
          </div>

          <p className="text-sm sm:text-[12px] md:text-[11px] lg:text-[12px] text-gray-600 dark:text-gray-400 line-clamp-3 mb-2 md:mb-[13px] max-w-full md:max-w-[515px]">
            {cleanExcerpt}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-2 md:gap-x-[9px] gap-y-1">
            {post.category && (
              <span className="inline-flex h-[17px] items-center bg-[#ff4b35] px-1.5 md:px-[9px] text-[7px] md:text-[8px] font-bold uppercase tracking-wider text-white">
                {post.category}
              </span>
            )}
            <span className="text-[8px] md:text-[9px] font-medium uppercase text-gray-400 dark:text-gray-500">
              {formattedDate}
            </span>
            <span className="text-[8px] md:text-[9px] text-gray-300 dark:text-gray-600">/</span>
            <span className="text-[8px] md:text-[9px] font-medium uppercase text-gray-400 dark:text-gray-500">
              BY {authorName}
            </span>
            <span className="text-[8px] md:text-[9px] text-gray-300 dark:text-gray-600">/</span>
            <span className="text-[8px] md:text-[9px] font-medium text-gray-400 dark:text-gray-500">
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
      `}</style>

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        {/* ─── Header ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 md:mb-8">
          <div>
            <p className="uppercase text-red-500 tracking-[3px] text-xs sm:text-sm font-bold">
              Browse &amp; Read
            </p>
            <h2
              id="latest-stories-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 text-black dark:text-white"
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
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors hidden sm:inline-block mt-2 sm:mt-0"
          >
            View All →
          </Link>
        </div>

        {/* ─── Story List ────────────────────────────────── */}
        {loading && initialLoad ? (
          <div className="flex flex-col gap-6 md:gap-[30px]">
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
            <ul className="flex flex-col gap-6 md:gap-[30px]">
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
