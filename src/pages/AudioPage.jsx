import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  createContext,
} from 'react';
import axios from 'axios';
import API from '../utils/api';
import {
  FiClock,
  FiCalendar,
  FiUser,
  FiPlay,
  FiPause,
  FiHeadphones,
  FiSearch,
  FiX,
  FiLoader,
  FiRadio,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import DOMPurify from 'dompurify';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });
const FALLBACK_IMG = 'https://via.placeholder.com/240x240/171410/F4F0E6?text=%E2%99%AB';

/* ────────────────────────────────────────────────────────────
   Design tokens live in .al-root / .dark .al-root below.
   Palette: stone paper + ink + VU-meter crimson + tape-reel gold.
   Type: Fraunces (display) / system sans (body) / mono (timestamps).
   Signature: a deterministic per-track waveform, echoed on every
   cover, every hover state, and the persistent mini-player.
   ──────────────────────────────────────────────────────────── */

/* ─── Helpers ──────────────────────────────────────────────── */
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

// Deterministic pseudo-waveform derived from a string, so every card
// carries a stable, track-specific shape instead of one repeated asset.
const generateWaveform = (seed = '', bars = 32) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const heights = [];
  for (let i = 0; i < bars; i++) {
    const x = Math.sin(hash + i * 12.9898) * 43758.5453;
    const frac = x - Math.floor(x);
    heights.push(16 + Math.round(frac * 84)); // 16–100%
  }
  return heights;
};

const formatDuration = (duration) => {
  if (!duration) return null;
  if (typeof duration === 'number' && isFinite(duration)) {
    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    const s = Math.floor(duration % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  return duration;
};

const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatRelativeDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
};

const isRecent = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  return (Date.now() - date.getTime()) / 86400000 <= 7;
};

const getPageWindow = (current, total) => {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
};

/* ─── Single-source-of-truth player context ──────────────────
   Only one <audio> element plays at a time; the mini-player and
   every card read/drive the same state instead of duplicating it. */
const AudioPlayerContext = createContext(null);
const useAudioPlayer = () => useContext(AudioPlayerContext);

const AudioPlayerProvider = ({ children }) => {
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [activeMeta, setActiveMeta] = useState(null);
  const refs = useRef({});

  const registerRef = useCallback((id, el) => {
    if (el) refs.current[id] = el;
    else delete refs.current[id];
  }, []);

  const pauseAll = useCallback((exceptId) => {
    Object.entries(refs.current).forEach(([id, el]) => {
      if (id !== exceptId && el && !el.paused) el.pause();
    });
  }, []);

  const play = useCallback(
    (id, meta) => {
      const el = refs.current[id];
      if (!el) return;
      pauseAll(id);
      setLoadingId(id);
      setActiveMeta(meta);
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => setLoadingId(null));
    },
    [pauseAll]
  );

  const pause = useCallback((id) => {
    const el = refs.current[id];
    if (el) el.pause();
  }, []);

  const seek = useCallback(
    (ratio) => {
      if (!playingId) return;
      const el = refs.current[playingId];
      if (el && isFinite(el.duration)) el.currentTime = ratio * el.duration;
    },
    [playingId]
  );

  const value = useMemo(
    () => ({
      playingId,
      setPlayingId,
      loadingId,
      setLoadingId,
      progress,
      setProgress,
      activeMeta,
      registerRef,
      play,
      pause,
      seek,
    }),
    [playingId, loadingId, progress, activeMeta, registerRef, play, pause, seek]
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
};

/* ─── Waveform (the signature element) ───────────────────────
   Static per-track shape at rest; the bars animate only while
   that specific track is the one playing. */
const Waveform = ({ seed, active = false, bars = 32, className = '' }) => {
  const heights = useMemo(() => generateWaveform(seed, bars), [seed, bars]);
  return (
    <div className={`al-waveform ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`al-wave-bar ${active ? 'al-wave-bar--active' : ''}`}
          style={{ height: `${h}%`, animationDelay: `${(i % 9) * 85}ms` }}
        />
      ))}
    </div>
  );
};

/* ─── Listen / Pause control ──────────────────────────────── */
const ListenButton = ({ isPlaying, isLoading, onClick, size = 'md' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-label={isPlaying ? 'Pause' : 'Listen now'}
    className={`al-focus relative overflow-hidden inline-flex items-center justify-center gap-1.5
                font-medium transition-all duration-300 ease-out active:scale-[0.97]
                disabled:opacity-70 disabled:cursor-wait
                ${size === 'lg' ? 'px-5 py-2.5 text-sm rounded-full' : 'px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full'}
                ${isPlaying
                  ? 'bg-[--al-signal] text-white'
                  : 'bg-[--al-ink] text-[--al-paper] hover:opacity-90'}`}
  >
    {isPlaying && !isLoading && <span className="absolute inset-0 bg-white/15 animate-pulse" aria-hidden="true" />}
    <span className="relative flex items-center gap-1.5">
      {isLoading ? (
        <FiLoader size={14} className="animate-spin" />
      ) : isPlaying ? (
        <FiPause size={14} />
      ) : (
        <FiPlay size={14} />
      )}
      {isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Listen'}
    </span>
  </button>
);

/* ─── Meta row (author · date · duration, mono timestamps) ─── */
const MetaRow = ({ audio, size = 'sm' }) => {
  const dur = formatDuration(audio.duration);
  const textSize = size === 'lg' ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs';
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${textSize} text-[--al-ink]/60 dark:text-white/50`}>
      <span className="flex items-center gap-1">
        <FiUser size={12} /> {audio.author}
      </span>
      <span className="flex items-center gap-1">
        <FiCalendar size={12} /> {formatRelativeDate(audio.publishedAt)}
      </span>
      {dur && (
        <span className="flex items-center gap-1 al-mono tabular-nums">
          <FiClock size={12} /> {dur}
        </span>
      )}
    </div>
  );
};

/* ─── Cover art with waveform + play affordance ─────────────── */
const Cover = ({ audio, isPlaying, isLoading, onToggle, aspect = 'aspect-[4/3]', big = false }) => (
  <div className={`relative ${aspect} overflow-hidden bg-[--al-ink]/5 dark:bg-white/5 flex-shrink-0 rounded-t-2xl sm:rounded-2xl`}>
    <img
      src={audio.coverImage || FALLBACK_IMG}
      alt={audio.title}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      loading="lazy"
      onError={(e) => {
        e.target.src = FALLBACK_IMG;
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

    {isRecent(audio.publishedAt) && (
      <span className="absolute top-2.5 left-2.5 al-mono text-[9px] tracking-widest uppercase font-semibold px-2 py-1 rounded-full bg-[--al-signal] text-white">
        New
      </span>
    )}

    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      aria-label={isPlaying ? 'Pause' : 'Listen now'}
      className={`al-focus absolute inset-0 flex items-center justify-center group/play`}
    >
      <span
        className={`flex items-center justify-center rounded-full border border-white/50 backdrop-blur-sm
                    transition-all duration-300 ${big ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-11 h-11 sm:w-14 sm:h-14'}
                    ${isPlaying ? 'bg-[--al-signal] border-[--al-signal] scale-100' : 'bg-black/35 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 scale-90 group-hover:scale-100'}
                    sm:opacity-100 sm:scale-100 sm:${isPlaying ? '' : 'bg-black/30'}`}
      >
        {isLoading ? (
          <FiLoader className="animate-spin text-white" size={big ? 22 : 16} />
        ) : isPlaying ? (
          <FiPause className="text-white" size={big ? 22 : 16} />
        ) : (
          <FiPlay className="text-white translate-x-[1px]" size={big ? 22 : 16} />
        )}
      </span>
    </button>

    <Waveform
      seed={audio.title}
      active={isPlaying}
      bars={big ? 46 : 30}
      className="absolute bottom-0 inset-x-0 h-6 sm:h-8 px-2 sm:px-3 pb-1.5 text-[--al-tape]/90"
    />
  </div>
);

/* ─── Grid card ───────────────────────────────────────────── */
const GridCard = ({ audio }) => {
  const { playingId, loadingId, play, pause, registerRef, setPlayingId, setLoadingId, setProgress } =
    useAudioPlayer();
  const [iframeVisible, setIframeVisible] = useState(false);
  const audioElRef = useRef(null);
  const media = useMemo(() => extractMediaSrc(audio.embedCode), [audio.embedCode]);
  const isPlaying = playingId === audio._id;
  const isLoading = loadingId === audio._id;

  const sanitizedIframe = useMemo(() => {
    if (media?.type !== 'iframe') return null;
    return DOMPurify.sanitize(media.raw, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
    });
  }, [media]);

  useEffect(() => {
    if (media?.type !== 'media') return undefined;
    registerRef(audio._id, audioElRef.current);
    return () => registerRef(audio._id, null);
  }, [media, audio._id, registerRef]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el || media?.type !== 'media') return undefined;
    const onPlay = () => {
      setPlayingId(audio._id);
      setLoadingId((id) => (id === audio._id ? null : id));
    };
    const onPause = () => setPlayingId((id) => (id === audio._id ? null : id));
    const onWaiting = () => setLoadingId(audio._id);
    const onCanPlay = () => setLoadingId((id) => (id === audio._id ? null : id));
    const onEnded = () => setPlayingId((id) => (id === audio._id ? null : id));
    const onTimeUpdate = () =>
      setProgress((p) => (playingId === audio._id ? { current: el.currentTime, duration: el.duration || 0 } : p));

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [media, audio._id, setPlayingId, setLoadingId, setProgress, playingId]);

  const handleToggle = () => {
    if (media?.type === 'iframe') {
      setIframeVisible((v) => !v);
      return;
    }
    if (isPlaying) pause(audio._id);
    else play(audio._id, { id: audio._id, title: audio.title, coverImage: audio.coverImage, author: audio.author });
  };

  return (
    <div className="al-card group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-[--al-line] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Cover audio={audio} isPlaying={media?.type === 'iframe' ? iframeVisible : isPlaying} isLoading={isLoading} onToggle={handleToggle} />

      <div className="flex-1 flex flex-col p-3.5 sm:p-4 gap-2">
        <h3 className="al-serif text-sm sm:text-base font-semibold leading-snug text-[--al-ink] dark:text-white line-clamp-2 group-hover:text-[--al-signal] transition-colors">
          {audio.title}
        </h3>
        <p className="text-xs sm:text-sm text-[--al-ink]/60 dark:text-white/55 line-clamp-2">{audio.description}</p>
        <MetaRow audio={audio} />

        <div className="mt-auto pt-2">
          {media?.type === 'media' ? (
            <>
              <audio ref={audioElRef} src={media.src} preload="none" className="hidden" />
              <ListenButton isPlaying={isPlaying} isLoading={isLoading} onClick={handleToggle} />
            </>
          ) : media?.type === 'iframe' ? (
            <>
              <ListenButton isPlaying={iframeVisible} isLoading={false} onClick={handleToggle} />
              {iframeVisible && (
                <div className="al-embed mt-2" dangerouslySetInnerHTML={{ __html: sanitizedIframe }} />
              )}
            </>
          ) : (
            <p className="text-[10px] text-[--al-signal]">Unable to load audio.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Hero (most recent episode, page 1 / unfiltered only) ──── */
const HeroCard = ({ audio }) => {
  const { playingId, loadingId, play, pause, registerRef, setPlayingId, setLoadingId, setProgress } =
    useAudioPlayer();
  const [iframeVisible, setIframeVisible] = useState(false);
  const audioElRef = useRef(null);
  const media = useMemo(() => extractMediaSrc(audio.embedCode), [audio.embedCode]);
  const isPlaying = playingId === audio._id;
  const isLoading = loadingId === audio._id;

  const sanitizedIframe = useMemo(() => {
    if (media?.type !== 'iframe') return null;
    return DOMPurify.sanitize(media.raw, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
    });
  }, [media]);

  useEffect(() => {
    if (media?.type !== 'media') return undefined;
    registerRef(audio._id, audioElRef.current);
    return () => registerRef(audio._id, null);
  }, [media, audio._id, registerRef]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el || media?.type !== 'media') return undefined;
    const onPlay = () => {
      setPlayingId(audio._id);
      setLoadingId((id) => (id === audio._id ? null : id));
    };
    const onPause = () => setPlayingId((id) => (id === audio._id ? null : id));
    const onWaiting = () => setLoadingId(audio._id);
    const onCanPlay = () => setLoadingId((id) => (id === audio._id ? null : id));
    const onEnded = () => setPlayingId((id) => (id === audio._id ? null : id));
    const onTimeUpdate = () =>
      setProgress((p) => (playingId === audio._id ? { current: el.currentTime, duration: el.duration || 0 } : p));

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [media, audio._id, setPlayingId, setLoadingId, setProgress, playingId]);

  const handleToggle = () => {
    if (media?.type === 'iframe') {
      setIframeVisible((v) => !v);
      return;
    }
    if (isPlaying) pause(audio._id);
    else play(audio._id, { id: audio._id, title: audio.title, coverImage: audio.coverImage, author: audio.author });
  };

  return (
    <div className="al-hero group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white dark:bg-zinc-800 border border-[--al-line] shadow-sm mb-8 sm:mb-12">
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[46%] lg:flex-shrink-0">
          <Cover audio={audio} isPlaying={media?.type === 'iframe' ? iframeVisible : isPlaying} isLoading={isLoading} onToggle={handleToggle} aspect="aspect-[16/10] lg:aspect-auto lg:h-full" big />
        </div>

        <div className="flex-1 p-5 sm:p-8 flex flex-col justify-center gap-3 sm:gap-4">
          <span className="al-mono inline-flex w-fit items-center gap-1.5 text-[10px] tracking-[3px] uppercase font-semibold text-[--al-signal]">
            <FiRadio size={12} /> Latest Episode
          </span>
          <h2 className="al-serif text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-[--al-ink] dark:text-white">
            {audio.title}
          </h2>
          <p className="text-sm sm:text-base text-[--al-ink]/65 dark:text-white/60 line-clamp-3">{audio.description}</p>
          <MetaRow audio={audio} size="lg" />

          <div className="mt-2">
            {media?.type === 'media' ? (
              <>
                <audio ref={audioElRef} src={media.src} preload="none" className="hidden" />
                <ListenButton isPlaying={isPlaying} isLoading={isLoading} onClick={handleToggle} size="lg" />
              </>
            ) : media?.type === 'iframe' ? (
              <>
                <ListenButton isPlaying={iframeVisible} isLoading={false} onClick={handleToggle} size="lg" />
                {iframeVisible && (
                  <div className="al-embed mt-3" dangerouslySetInnerHTML={{ __html: sanitizedIframe }} />
                )}
              </>
            ) : (
              <p className="text-xs text-[--al-signal]">Unable to load audio.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Sticky mini-player ─────────────────────────────────────
   Appears once something is playing; scrubbing seeks the actual
   <audio> element owned by the matching card via context. */
const MiniPlayer = () => {
  const { playingId, activeMeta, progress, pause, seek } = useAudioPlayer();
  if (!playingId || !activeMeta) return null;

  const pct = progress.duration ? Math.min((progress.current / progress.duration) * 100, 100) : 0;

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(Math.min(Math.max(ratio, 0), 1));
  };

  return (
    <div className="al-mini-player fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-[--al-line]">
      <div
        className="h-1 w-full cursor-pointer bg-[--al-ink]/10 dark:bg-white/10"
        onClick={handleSeek}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className="h-full bg-[--al-signal] transition-[width] duration-150" style={{ width: `${pct}%` }} />
      </div>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
        <img
          src={activeMeta.coverImage || FALLBACK_IMG}
          alt=""
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.target.src = FALLBACK_IMG;
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="al-serif text-xs sm:text-sm font-semibold truncate text-[--al-ink] dark:text-white">
            {activeMeta.title}
          </p>
          <p className="text-[10px] sm:text-xs text-[--al-ink]/55 dark:text-white/50 truncate">{activeMeta.author}</p>
        </div>
        <Waveform seed={activeMeta.title} active bars={16} className="hidden xs:flex h-5 w-12 sm:w-16 text-[--al-signal]" />
        <span className="hidden sm:block al-mono text-[10px] tabular-nums text-[--al-ink]/55 dark:text-white/50">
          {formatTime(progress.current)} / {formatTime(progress.duration)}
        </span>
        <button
          type="button"
          onClick={() => pause(playingId)}
          aria-label="Pause"
          className="al-focus w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-[--al-ink] text-[--al-paper] hover:opacity-90 active:scale-95 transition-all"
        >
          <FiPause size={14} />
        </button>
      </div>
    </div>
  );
};

/* ─── Search ──────────────────────────────────────────────── */
const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full sm:max-w-md">
    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[--al-ink]/40 dark:text-white/40" size={17} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search episodes, hosts, topics…"
      className="al-focus w-full pl-10 pr-9 py-2.5 rounded-full border border-[--al-line]
                 bg-white dark:bg-zinc-800 text-sm text-[--al-ink] dark:text-white
                 placeholder-[--al-ink]/40 dark:placeholder-white/35
                 transition-colors duration-200"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="al-focus absolute right-3 top-1/2 -translate-y-1/2 text-[--al-ink]/40 hover:text-[--al-ink] dark:text-white/40 dark:hover:text-white"
      >
        <FiX size={16} />
      </button>
    )}
  </div>
);

/* ─── Pagination ──────────────────────────────────────────── */
const Pagination = ({ page, totalPages, onChange }) => {
  const pages = getPageWindow(page, totalPages);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 sm:mt-14">
      <button
        onClick={() => onChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="al-focus w-9 h-9 flex items-center justify-center rounded-full border border-[--al-line] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[--al-ink]/5 dark:hover:bg-white/10 transition-colors"
      >
        <FiChevronLeft size={16} />
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {gap && <span className="px-1 text-xs text-[--al-ink]/40 dark:text-white/40">…</span>}
            <button
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`al-focus al-mono w-9 h-9 rounded-full text-xs sm:text-sm font-medium transition-colors
                          ${p === page ? 'bg-[--al-ink] text-[--al-paper]' : 'hover:bg-[--al-ink]/5 dark:hover:bg-white/10 text-[--al-ink] dark:text-white'}`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={() => onChange(Math.min(page + 1, totalPages))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="al-focus w-9 h-9 flex items-center justify-center rounded-full border border-[--al-line] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[--al-ink]/5 dark:hover:bg-white/10 transition-colors"
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  );
};

/* ─── Skeletons ───────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="al-shimmer rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-[--al-line]">
    <div className="aspect-[4/3] bg-[--al-ink]/10 dark:bg-white/10" />
    <div className="p-4 space-y-2.5">
      <div className="h-4 rounded bg-[--al-ink]/10 dark:bg-white/10 w-3/4" />
      <div className="h-3 rounded bg-[--al-ink]/10 dark:bg-white/10 w-full" />
      <div className="h-3 rounded bg-[--al-ink]/10 dark:bg-white/10 w-2/3" />
      <div className="h-7 rounded-full bg-[--al-ink]/10 dark:bg-white/10 w-24" />
    </div>
  </div>
);

const SkeletonHero = () => (
  <div className="al-shimmer rounded-3xl overflow-hidden bg-white dark:bg-zinc-800 border border-[--al-line] mb-8 sm:mb-12">
    <div className="flex flex-col lg:flex-row">
      <div className="lg:w-[46%] aspect-[16/10] lg:aspect-auto lg:h-80 bg-[--al-ink]/10 dark:bg-white/10" />
      <div className="flex-1 p-6 sm:p-8 space-y-3">
        <div className="h-3 rounded bg-[--al-ink]/10 dark:bg-white/10 w-28" />
        <div className="h-8 rounded bg-[--al-ink]/10 dark:bg-white/10 w-4/5" />
        <div className="h-3 rounded bg-[--al-ink]/10 dark:bg-white/10 w-full" />
        <div className="h-3 rounded bg-[--al-ink]/10 dark:bg-white/10 w-3/5" />
        <div className="h-9 rounded-full bg-[--al-ink]/10 dark:bg-white/10 w-32 mt-2" />
      </div>
    </div>
  </div>
);

/* ─── Header ──────────────────────────────────────────────── */
const Header = ({ search, onSearchChange }) => (
  <div className="sticky top-0 z-30 bg-[--al-paper]/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-[--al-line]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <span className="al-mono flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[4px] text-[--al-signal]">
          <FiHeadphones size={13} /> Listen
        </span>
        <h1 className="al-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[--al-ink] dark:text-white mt-0.5">
          Audio Library
        </h1>
      </div>
      <SearchBar value={search} onChange={onSearchChange} />
    </div>
  </div>
);

/* ─── Main page ───────────────────────────────────────────── */
const AudioPageInner = () => {
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
      [a.title, a.description, a.author].filter(Boolean).some((field) => field.toLowerCase().includes(q))
    );
  }, [audioList, search]);

  const showHero = page === 1 && !search && filteredAudioList.length > 0;
  const heroAudio = showHero ? filteredAudioList[0] : null;
  const restAudio = showHero ? filteredAudioList.slice(1) : filteredAudioList;

  return (
    <div className="al-root min-h-screen bg-[--al-paper] dark:bg-zinc-900 pb-28">
      <Header search={search} onSearchChange={setSearch} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-7 sm:pt-10">
        {loading ? (
          <>
            <SkeletonHero />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </>
        ) : error ? (
          <div className="text-center py-20">
            <p className="al-serif text-lg text-[--al-signal] mb-1">Something went wrong</p>
            <p className="text-sm text-[--al-ink]/60 dark:text-white/50">{error}</p>
            <button
              onClick={() => fetchAudio(page)}
              className="al-focus mt-5 px-5 py-2 rounded-full bg-[--al-ink] text-[--al-paper] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : audioList.length === 0 ? (
          <div className="text-center py-20">
            <FiHeadphones className="mx-auto mb-3 text-[--al-ink]/25 dark:text-white/20" size={40} />
            <p className="al-serif text-lg text-[--al-ink] dark:text-white">No audio content yet</p>
            <p className="text-sm text-[--al-ink]/55 dark:text-white/45 mt-1">Check back soon for new episodes.</p>
          </div>
        ) : filteredAudioList.length === 0 ? (
          <div className="text-center py-20">
            <FiSearch className="mx-auto mb-3 text-[--al-ink]/25 dark:text-white/20" size={40} />
            <p className="al-serif text-lg text-[--al-ink] dark:text-white">No results for “{search}”</p>
            <p className="text-sm text-[--al-ink]/55 dark:text-white/45 mt-1">Try a different search term.</p>
          </div>
        ) : (
          <>
            {showHero && <HeroCard audio={heroAudio} />}

            {restAudio.length > 0 && (
              <>
                {showHero && (
                  <p className="al-mono text-[10px] tracking-[3px] uppercase font-semibold text-[--al-ink]/45 dark:text-white/40 mb-4">
                    More Episodes
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {restAudio.map((audio) => (
                    <GridCard key={audio._id} audio={audio} />
                  ))}
                </div>
              </>
            )}

            {totalPages > 1 && !search && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </>
        )}
      </main>

      <MiniPlayer />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');

        .al-root {
          --al-paper: #efeee6;
          --al-ink: #14170f;
          --al-signal: #c4173b;
          --al-tape: #b08d3e;
          --al-line: rgba(20, 23, 15, 0.1);
        }
        .dark .al-root {
          --al-paper: #18181b;
          --al-ink: #f2f0e9;
          --al-signal: #ff4463;
          --al-tape: #e3be6e;
          --al-line: rgba(255, 255, 255, 0.1);
        }

        .al-serif {
          font-family: 'Fraunces', ui-serif, Georgia, serif;
          font-optical-sizing: auto;
        }
        .al-mono {
          font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
          font-variant-numeric: tabular-nums;
        }

        .al-focus:focus-visible {
          outline: 2px solid var(--al-signal);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .al-waveform {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 100%;
        }
        .al-wave-bar {
          width: 2px;
          flex: 1;
          max-width: 3px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: bottom;
        }
        .al-wave-bar--active {
          animation: al-eq 0.9s ease-in-out infinite;
        }
        @keyframes al-eq {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }

        .al-shimmer {
          position: relative;
          overflow: hidden;
        }
        .al-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transform: translateX(-100%);
          animation: al-shimmer 1.6s infinite;
        }
        @keyframes al-shimmer {
          100% { transform: translateX(100%); }
        }

        .al-mini-player {
          animation: al-slide-up 0.3s ease-out;
        }
        @keyframes al-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .al-embed iframe {
          width: 100%;
          max-width: 100%;
          height: 100px;
          border-radius: 12px;
        }
        @media (min-width: 640px) {
          .al-embed iframe { height: 120px; }
        }
        @media (min-width: 768px) {
          .al-embed iframe { height: 152px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .al-wave-bar--active,
          .al-shimmer::after,
          .al-mini-player,
          .animate-pulse,
          .animate-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const AudioPage = () => (
  <AudioPlayerProvider>
    <AudioPageInner />
  </AudioPlayerProvider>
);

export default AudioPage;
