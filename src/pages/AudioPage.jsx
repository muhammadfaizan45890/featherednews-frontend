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

const formatTime = (secs) => {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ─── Skeleton (responsive: stacked on mobile, horizontal from sm up) ─
const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-zinc-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row">
    <div className="w-full sm:w-32 md:w-36 aspect-[16/9] sm:aspect-square bg-gray-300 dark:bg-zinc-700 flex-shrink-0" />
    <div className="flex-1 p-4 space-y-2.5">
      <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-full" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-2/3" />
      <div className="flex gap-3 pt-1">
        <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-14" />
        <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-14" />
      </div>
      <div className="h-9 bg-gray-300 dark:bg-zinc-700 rounded-full w-28" />
    </div>
  </div>
);

// ─── Tiny animated equalizer, shown only while actually playing ────
const EqBars = () => (
  <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-[3px] bg-white rounded-full animate-[eq_0.9s_ease-in-out_infinite]"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// ─── Listen / Pause Toggle Button ───────────────────────────
const ListenButton = ({ isPlaying, isLoading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-label={isPlaying ? 'Pause' : 'Listen now'}
    className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5
                rounded-full text-xs sm:text-sm font-semibold tracking-wide
                transition-all duration-300 ease-out
                active:scale-95
                disabled:opacity-70 disabled:cursor-wait
                outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                dark:focus-visible:ring-offset-zinc-800
                ${isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md'}`}
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    {isPlaying && !isLoading && (
      <span className="absolute inset-0 bg-white/10 animate-pulse" aria-hidden="true" />
    )}
    <span className="relative flex items-center gap-2">
      {isLoading ? (
        <FiLoader size={14} className="animate-spin" />
      ) : isPlaying ? (
        <>
          <FiPause size={14} />
          <EqBars />
        </>
      ) : (
        <FiPlay size={14} />
      )}
      <span>{isLoading ? 'Loading…' : isPlaying ? 'Pause' : 'Listen'}</span>
    </span>
  </button>
);

// ─── Individual Audio Card ──────────────────────────────────
// Mobile (<640px): stacked — full-width 16:9 cover on top, content below.
// Tablet+/Desktop (≥640px): horizontal — square cover on the left, content fills the rest.
const AudioCard = ({ audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeVisible, setIframeVisible] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
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

  const handleSeek = (e) => {
    const el = audioRef.current;
    if (!el || !progress.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    el.currentTime = ratio * progress.duration;
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
    const onTimeUpdate = () =>
      setProgress({ current: el.currentTime, duration: el.duration || 0 });
    const onLoadedMeta = () =>
      setProgress((p) => ({ ...p, duration: el.duration || 0 }));

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMeta);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMeta);
    };
  }, [media]);

  const pct = progress.duration ? (progress.current / progress.duration) * 100 : 0;

  return (
    <div
      className="bg-white dark:bg-zinc-800 rounded-2xl shadow-md overflow-hidden
                 border border-gray-200 dark:border-zinc-700
                 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5
                 group flex flex-col sm:flex-row"
    >
      {/* Cover image — full-width 16:9 on mobile, square panel on sm+ */}
      <div className="relative w-full sm:w-32 md:w-40 lg:w-44 aspect-[16/9] sm:aspect-square flex-shrink-0 overflow-hidden">
        <img
          src={audio.coverImage || 'https://via.placeholder.com/240x240/111111/FFFFFF?text=No+Image'}
          alt={audio.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/240x240/111111/FFFFFF?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm px-2 py-1 rounded-full">
          <FiHeadphones className="text-white/90" size={11} />
          <span className="text-white/90 text-[9px] sm:text-[8px] font-medium uppercase tracking-wide">Listen</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 sm:p-4 md:p-5 flex flex-col justify-between min-w-0 gap-3">
        <div>
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-black dark:text-white line-clamp-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
            {audio.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {audio.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <FiUser size={11} /> {audio.author}
            </span>
            <span className="flex items-center gap-1">
              <FiCalendar size={11} /> {new Date(audio.publishedAt).toLocaleDateString()}
            </span>
            {audio.duration && (
              <span className="flex items-center gap-1">
                <FiClock size={11} /> {audio.duration}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {media?.type === 'media' ? (
            <>
              <audio ref={audioRef} src={media.src} preload="none" className="hidden" />
              <div className="flex items-center gap-3 flex-wrap">
                <ListenButton isPlaying={isPlaying} isLoading={isLoading} onClick={handleToggle} />
                {progress.duration > 0 && (
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {formatTime(progress.current)} / {formatTime(progress.duration)}
                  </span>
                )}
              </div>
              {progress.duration > 0 && (
                <div
                  role="slider"
                  aria-label="Seek"
                  aria-valuemin={0}
                  aria-valuemax={progress.duration}
                  aria-valuenow={progress.current}
                  tabIndex={0}
                  onClick={handleSeek}
                  className="h-1.5 w-full max-w-xs rounded-full bg-gray-200 dark:bg-zinc-700 cursor-pointer overflow-hidden"
                >
                  <div
                    className="h-full bg-red-500 rounded-full transition-[width] duration-150"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </>
          ) : media?.type === 'iframe' ? (
            <>
              <ListenButton isPlaying={iframeVisible} isLoading={false} onClick={handleToggle} />
              {iframeVisible && (
                <div
                  className="audio-embed-container rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizedIframe }}
                />
              )}
            </>
          ) : (
            <p className="text-xs text-red-500">Unable to load audio.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Search Bar ──────────────────────────────────────────────
const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full sm:max-w-md">
    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search episodes, authors, topics…"
      className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-full border border-gray-200 dark:border-zinc-700
                 bg-white dark:bg-zinc-800 text-sm text-black dark:text-white
                 placeholder-gray-400 dark:placeholder-gray-500
                 transition-colors duration-200
                 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                   dark:hover:text-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full p-0.5"
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
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-6 sm:py-10 md:py-12 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-black dark:bg-white rounded-lg">
              <FiHeadphones className="text-white dark:text-black" size={18} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[4px] text-red-500">Listen</span>
          </div>
          <h1 className="text-[clamp(1.75rem,6vw,3rem)] font-bold text-black dark:text-white leading-tight">
            Audio Library
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-prose">
            Explore our latest episodes and audio content – press play and immerse yourself.
          </p>

          <div className="mt-4 sm:mt-5">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Content */}
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
              className="mt-4 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
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
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Previous
                </button>
                <span className="px-2 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes eq {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        .audio-embed-container iframe {
          width: 100%;
          max-width: 100%;
          height: 100px;
          border: 0;
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
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioPage;
