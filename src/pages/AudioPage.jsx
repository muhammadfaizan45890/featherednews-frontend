import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API from '../utils/api';
import { FiClock, FiCalendar, FiUser, FiPlay, FiPause, FiHeadphones } from 'react-icons/fi';
import DOMPurify from 'dompurify';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// ─── Skeleton Card ──────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700">
    <div className="w-full h-48 bg-gray-300 dark:bg-zinc-600" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-300 dark:bg-zinc-600 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded w-full" />
      <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded w-2/3" />
      <div className="flex gap-3">
        <div className="h-3 bg-gray-300 dark:bg-zinc-600 rounded w-16" />
        <div className="h-3 bg-gray-300 dark:bg-zinc-600 rounded w-16" />
      </div>
      <div className="h-10 bg-gray-300 dark:bg-zinc-600 rounded w-full" />
    </div>
  </div>
);

// ─── Individual Audio Card ──────────────────────────────────
const AudioCard = ({ audio }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);

  const handleListenClick = () => {
    if (!showPlayer) {
      setPlayerLoading(true);
      // Simulate iframe load (actual load happens via React re-render)
      setTimeout(() => setPlayerLoading(false), 600);
      setShowPlayer(true);
    } else {
      setShowPlayer(false);
    }
  };

  const sanitizedEmbed = DOMPurify.sanitize(audio.embedCode, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
  });

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      {audio.coverImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={audio.coverImage}
            alt={audio.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <FiHeadphones className="text-white/80" size={16} />
            <span className="text-white/80 text-xs font-medium">Listen</span>
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-black dark:text-white line-clamp-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
          {audio.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {audio.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="flex items-center gap-1">
            <FiUser size={12} /> {audio.author}
          </span>
          <span className="flex items-center gap-1">
            <FiCalendar size={12} /> {new Date(audio.publishedAt).toLocaleDateString()}
          </span>
          {audio.duration && (
            <span className="flex items-center gap-1">
              <FiClock size={12} /> {audio.duration}
            </span>
          )}
        </div>

        <div className="mt-3">
          {!showPlayer ? (
            <button
              onClick={handleListenClick}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FiPlay size={16} /> Listen Now
            </button>
          ) : (
            <div className="relative">
              {playerLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-black dark:border-white border-t-transparent" />
                </div>
              ) : (
                <div
                  className="audio-embed-container"
                  dangerouslySetInnerHTML={{ __html: sanitizedEmbed }}
                />
              )}
              <button
                onClick={handleListenClick}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <FiPause size={12} /> Hide player
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────
const AudioPage = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchAudio = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/audio', { params: { page: pageNum, limit: 12 } });
      if (res.data.success) {
        setAudioList(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        setError(res.data.message || 'Failed to load audio');
      }
    } catch (err) {
      console.error('Fetch audio error:', err);
      setError('Failed to load audio. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudio(page);
  }, [page, fetchAudio]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-black dark:bg-white rounded-lg">
              <FiHeadphones className="text-white dark:text-black" size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[4px] text-red-500">Listen</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white">
            Audio Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Explore our latest episodes and audio content – press play and immerse yourself.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchAudio(page)}
              className="mt-4 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : audioList.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎧</div>
            <p className="text-xl text-gray-500 dark:text-gray-400">No audio content yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Check back soon for new episodes.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {audioList.map((audio) => (
                <AudioCard key={audio._id} audio={audio} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8 sm:mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Custom Styles ────────────────────────────────── */}
      <style jsx>{`
        .audio-embed-container iframe {
          width: 100%;
          max-width: 100%;
          border-radius: 8px;
          height: 152px;
        }
        @media (max-width: 480px) {
          .audio-embed-container iframe {
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioPage;
