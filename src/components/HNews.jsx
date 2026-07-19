import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API from "../utils/api";

// ─── Helper: strip HTML tags ──────────────────────────
const stripHtml = (html) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || '';
};

// ─── Helper: reliable API instance ──────────────────
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

const HNews = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/api/posts', {
          params: { page: 1, limit: 6, sort: 'desc' }
        });
        // No category filter → fetches both news and blogs
        setPosts(res.data.data || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.response?.data?.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Split posts: first 2 as featured, next 4 as small
  const featuredPosts = posts.slice(0, 2);
  const smallPosts = posts.slice(2, 6);

  // ─── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
          <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Stories</h2>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
        </div>
      </section>
    );
  }

  // ─── Error state ────────────────────────────────────
  if (error) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
          <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Stories</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ─── No posts ──────────────────────────────────────
  if (posts.length === 0) {
    return (
      <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
          <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Stories</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No stories available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      {/* Heading with accent */}
      <div className="flex items-center gap-3 mb-8 sm:mb-10 md:mb-12">
        <div className="w-4 h-4 bg-red-500 flex-shrink-0" />
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">News</h2>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
        {/* Left Side – small news cards (2 columns on md+, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {smallPosts.map((item) => (
            <Link
              key={item._id}
              to={`/news/${item.slug || item._id}`}
              className="group cursor-pointer block"
            >
              <div className="overflow-hidden">
                <img
                  src={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/600x400?text=No+Image'}
                  alt={item.title}
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
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </Link>
          ))}
        </div>

        {/* Right Side – featured news (stacked vertically) */}
        <div className="space-y-6 md:space-y-8">
          {featuredPosts.map((item) => (
            <Link
              key={item._id}
              to={`/news/${item.slug || item._id}`}
              className="relative group overflow-hidden block"
            >
              <img
                src={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/1200x400?text=No+Image'}
                alt={item.title}
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
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* "See All" link */}
      <div className="mt-10 sm:mt-12 md:mt-14 text-center">
        <Link
          to="/news"
          className="inline-block px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 text-sm sm:text-base font-semibold uppercase tracking-wider"
        >
          See All Stories →
        </Link>
      </div>
    </section>
  );
};

export default HNews;