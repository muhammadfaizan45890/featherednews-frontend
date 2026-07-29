import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import API from '../utils/api';
import { FiClock, FiCalendar, FiUser, FiPlay, FiPause, FiHeadphones, FiSearch, FiX, FiLoader } from 'react-icons/fi';
import DOMPurify from 'dompurify';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// ─── Helpers ────────────────────────────────────────────────
const extractMediaSrc = (embedCode) => {
  if (!embedCode) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(embedCode, 'text/html');
    const media = doc.querySelector('audio, video');
    if (media) {
      const directSrc = media.getAttribute('src');
      if (directSrc) return { type: 'media', src: directSrc };
      const source = media.querySelector('source');
      if (source && source.getAttribute('src')) {
        return { type: 'media', src: source.getAttribute('src') };
      }
    }
    const iframe = doc.querySelector('iframe');
    if (iframe && iframe.getAttribute('src')) {
      return { type: 'iframe', src: iframe.getAttribute('src'), raw: embedCode };
    }
  } catch (e) {
    console.error('Failed to parse embed code:', e);
  }
  return null;
};

// ─── Skeleton (horizontal) ──────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-zinc-800 shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700 flex flex-row">
    <div className="w-16 sm:w-20 md:w-28 aspect-square bg-gray-300 dark:bg-zinc-600 flex-shrink-0" />
    <div className="flex-1 p-3 sm:p-4 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-zinc-600 w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-600 w-full" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-600 w-2/3" />
      <div className="flex gap-3">
        <div className="h-3 bg-gray-300 dark:bg-zinc-600 w-12" />
        <div className="h-3 bg-gray-300 dark:bg-zinc-600 w-12" />
      </div>
      <div className="h-8 bg-gray-300 dark:bg-zinc-600 w-24" />
    </div>
  </div>
);

// ─── Listen / Pause Toggle Button ───────────────────────────
const ListenButton = ({ isPlaying, isLoading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-label={isPlaying ? 'Pause' : 'Listen now'}
    className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2
                text-xs sm:text-sm font-medium
                transition-colors duration-300 ease-out
                active:scale-[0.98] transition-transform
                disabled:opacity-70 disabled:cursor-wait
                outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0
                ${isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}`}
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    {isPlaying && !isLoading && (
      <span className="absolute inset-0 bg-white/15 animate-pulse" aria-hidden="true" />
    )}
    <span className="relative flex items-center gap-1.5">
      {isLoading ? (
        <FiLoader size={14} className="animate-spin" />
      ) : isPlaying ? (
        <FiPause size={14} />
      ) : (
        <FiPlay size={14} />
      )}
      {isLoading ? 'Loading…' : isPlaying ? 'Pause' : 'Listen'}
    </span>
  </button>
);

// ─── Individual Audio Card (horizontal) ─────────────────────
const AudioCard = ({ audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeVisible, setIframeVisible] = useState(false);
  const audioRef = useRef(null);

  const media = useMemo(() => extractMediaSrc(audio.embedCode), [audio.embedCode]);

  const sanitizedIframe = useMemo(() => {
    if (media?.type !== 'iframe') return null;
    return DOMPurify.sanitize(media.raw, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
    });
  }, [media]);

  const handleToggle = () => {
    if (media?.type === 'iframe') {
      setIframeVisible((v) => !v);
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      setIsLoading(true);
      const playPromise = el.play();
      if (playPromise) playPromise.catch(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el || media?.type !== 'media') return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
    };
  }, [media]);

  return (
    <div className="bg-white dark:bg-zinc-800 shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group flex flex-row">
      {/* Image (square, responsive) */}
      <div className="relative w-16 sm:w-20 md:w-28 aspect-square flex-shrink-0 overflow-hidden">
        <img
          src={audio.coverImage || 'https://via.placeholder.com/120x120/111111/FFFFFF?text=No+Image'}
          alt={audio.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/120x120/111111/FFFFFF?text=No+Image';
          }}
        />
        {/* "Listen" badge - hidden on very small screens */}
        <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded hidden xs:flex">
          <FiHeadphones className="text-white/80" size={10} />
          <span className="text-white/80 text-[8px] font-medium">Listen</span>
        </div>
      </div>

      {/* Content (flex-1, with responsive padding) */}
      <div className="flex-1 p-2 sm:p-3 md:p-4 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-black dark:text-white line-clamp-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
            {audio.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-2">
            {audio.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className="flex items-center gap-0.5">
              <FiUser size={10} /> {audio.author}
            </span>
            <span className="flex items-center gap-0.5">
              <FiCalendar size={10} /> {new Date(audio.publishedAt).toLocaleDateString()}
            </span>
            {audio.duration && (
              <span className="flex items-center gap-0.5">
                <FiClock size={10} /> {audio.duration}
              </span>
            )}
          </div>
        </div>

        <div className="mt-1 sm:mt-2">
          {media?.type === 'media' ? (
            <>
              <audio ref={audioRef} src={media.src} preload="none" className="hidden" />
              <ListenButton isPlaying={isPlaying} isLoading={isLoading} onClick={handleToggle} />
            </>
          ) : media?.type === 'iframe' ? (
            <>
              <ListenButton isPlaying={iframeVisible} isLoading={false} onClick={handleToggle} />
              {iframeVisible && (
                <div
                  className="audio-embed-container mt-1"
                  dangerouslySetInnerHTML={{ __html: sanitizedIframe }}
                />
              )}
            </>
          ) : (
            <p className="text-[10px] text-red-500">Unable to load audio.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Search Bar (rounded) ──────────────────────────────────
const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full sm:max-w-md">
    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search episodes, authors, topics…"
      className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-full border border-gray-200 dark:border-zinc-700
                 bg-white dark:bg-zinc-800 text-sm text-black dark:text-white
                 placeholder-gray-400 dark:placeholder-gray-500
                 transition-colors duration-200
                 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                   dark:hover:text-gray-200 outline-none focus:outline-none focus-visible:outline-none"
      >
        <FiX size={16} />
      </button>
    )}
  </div>
);

// ─── Main Component ─────────────────────────────────────────
const AudioPage = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

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

  const filteredAudioList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audioList;
    return audioList.filter((a) =>
      [a.title, a.description, a.author]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [audioList, search]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-6 sm:py-12 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-black dark:bg-white rounded-lg">
              <FiHeadphones className="text-white dark:text-black" size={18} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[4px] text-red-500">Listen</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white">
            Audio Library
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Explore our latest episodes and audio content – press play and immerse yourself.
          </p>

          <div className="mt-4 sm:mt-5">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Content – Horizontal List */}
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchAudio(page)}
              className="mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg outline-none focus:outline-none focus-visible:outline-none text-sm"
            >
              Retry
            </button>
          </div>
        ) : audioList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎧</div>
            <p className="text-lg text-gray-500 dark:text-gray-400">No audio content yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for new episodes.</p>
          </div>
        ) : filteredAudioList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-lg text-gray-500 dark:text-gray-400">No results for "{search}".</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {filteredAudioList.map((audio) => (
                <AudioCard key={audio._id} audio={audio} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !search && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
                >
                  Previous
                </button>
                <span className="px-2 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .audio-embed-container iframe {
          width: 100%;
          max-width: 100%;
          height: 100px;
        }
        @media (min-width: 640px) {
          .audio-embed-container iframe {
            height: 120px;
          }
        }
        @media (min-width: 768px) {
          .audio-embed-container iframe {
            height: 152px;
          }
        }
        button:focus,
        input:focus,
        button:focus-visible,
        input:focus-visible {
          outline: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default AudioPage;
