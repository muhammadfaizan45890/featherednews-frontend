// import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import API from '../utils/api';
// import {
//   FiClock, FiCalendar, FiUser, FiPlay, FiPause, FiHeadphones,
//   FiSearch, FiX, FiLoader, FiChevronLeft, FiChevronRight
// } from 'react-icons/fi';
// import DOMPurify from 'dompurify';

// const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// // ─── Helpers ────────────────────────────────────────────────
// const extractMediaSrc = (embedCode) => {
//   if (!embedCode) return null;
//   try {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(embedCode, 'text/html');
//     const media = doc.querySelector('audio, video');
//     if (media) {
//       const directSrc = media.getAttribute('src');
//       if (directSrc) return { type: 'media', src: directSrc };
//       const source = media.querySelector('source');
//       if (source && source.getAttribute('src')) {
//         return { type: 'media', src: source.getAttribute('src') };
//       }
//     }
//     const iframe = doc.querySelector('iframe');
//     if (iframe && iframe.getAttribute('src')) {
//       return { type: 'iframe', src: iframe.getAttribute('src'), raw: embedCode };
//     }
//   } catch (e) {
//     console.error('Failed to parse embed code:', e);
//   }
//   return null;
// };

// const formatTime = (secs) => {
//   if (!isFinite(secs) || secs < 0) return '0:00';
//   const m = Math.floor(secs / 60);
//   const s = Math.floor(secs % 60);
//   return `${m}:${s.toString().padStart(2, '0')}`;
// };

// // ─── Skeleton ──────────────────────────────────────────────
// const SkeletonCard = () => (
//   <div className="animate-pulse bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700">
//     <div className="aspect-square bg-gray-300 dark:bg-zinc-700" />
//     <div className="p-3 space-y-2">
//       <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
//       <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-full" />
//       <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/2" />
//     </div>
//   </div>
// );

// // ─── Tiny equalizer bars ──────────────────────────────────
// const EqBars = () => (
//   <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
//     {[0, 1, 2].map((i) => (
//       <span
//         key={i}
//         className="w-[3px] bg-white rounded-full animate-[eq_0.9s_ease-in-out_infinite]"
//         style={{ animationDelay: `${i * 0.15}s` }}
//       />
//     ))}
//   </span>
// );

// // ─── Player Overlay ───────────────────────────────────────
// const AudioPlayerOverlay = ({
//   audio,
//   isOpen,
//   onClose,
//   media,
//   sanitizedIframe,
//   audioRef,
//   isPlaying,
//   isLoading,
//   progress,
//   handleToggle,
//   handleSeek,
// }) => {
//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative transition-transform duration-300 scale-100"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Close button */}
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//         >
//           <FiX size={24} />
//         </button>

//         {/* Cover */}
//         <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-700 mb-4">
//           <img
//             src={audio.coverImage || 'https://via.placeholder.com/400x400/111111/FFFFFF?text=No+Image'}
//             alt={audio.title}
//             className="w-full h-full object-cover"
//           />
//         </div>

//         {/* Title & metadata */}
//         <h3 className="text-xl font-bold text-black dark:text-white line-clamp-2">{audio.title}</h3>
//         <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{audio.description}</p>
//         <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
//           <span className="flex items-center gap-1"><FiUser size={12} /> {audio.author}</span>
//           <span className="flex items-center gap-1"><FiCalendar size={12} /> {new Date(audio.publishedAt).toLocaleDateString()}</span>
//         </div>

//         {/* Player controls */}
//         <div className="mt-4">
//           {media?.type === 'media' ? (
//             <>
//               <audio ref={audioRef} src={media.src} preload="none" className="hidden" />
//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={handleToggle}
//                   disabled={isLoading}
//                   className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
//                 >
//                   {isLoading ? (
//                     <FiLoader size={20} className="animate-spin" />
//                   ) : isPlaying ? (
//                     <FiPause size={20} />
//                   ) : (
//                     <FiPlay size={20} />
//                   )}
//                 </button>
//                 <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
//                   {formatTime(progress.current)} / {formatTime(progress.duration)}
//                 </span>
//               </div>
//               {progress.duration > 0 && (
//                 <div
//                   role="slider"
//                   aria-label="Seek"
//                   tabIndex={0}
//                   onClick={handleSeek}
//                   className="h-1.5 w-full mt-2 rounded-full bg-gray-200 dark:bg-zinc-700 cursor-pointer overflow-hidden"
//                 >
//                   <div
//                     className="h-full bg-red-500 rounded-full transition-[width] duration-150"
//                     style={{ width: `${(progress.current / progress.duration) * 100}%` }}
//                   />
//                 </div>
//               )}
//             </>
//           ) : media?.type === 'iframe' ? (
//             <div
//               className="audio-embed-container"
//               dangerouslySetInnerHTML={{ __html: sanitizedIframe }}
//             />
//           ) : (
//             <p className="text-red-500 text-sm">Unable to load audio.</p>
//           )}
//         </div>

//         {/* Now playing indicator */}
//         {isPlaying && media?.type === 'media' && (
//           <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
//             <EqBars />
//             <span>Now playing</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ─── Individual Audio Card ────────────────────────────────
// const AudioCard = ({ audio, onClick }) => {
//   const coverUrl = audio.coverImage || 'https://via.placeholder.com/200x200/111111/FFFFFF?text=No+Image';

//   return (
//     <div
//       onClick={() => onClick(audio)}
//       className="bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700
//                  transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
//     >
//       <div className="aspect-square overflow-hidden">
//         <img
//           src={coverUrl}
//           alt={audio.title}
//           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//           loading="lazy"
//           onError={(e) => {
//             e.target.src = 'https://via.placeholder.com/200x200/111111/FFFFFF?text=No+Image';
//           }}
//         />
//       </div>
//       <div className="p-2.5 sm:p-3">
//         <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white line-clamp-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
//           {audio.title}
//         </h3>
//         <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
//           {audio.description}
//         </p>
//         <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-1">
//           <span className="flex items-center gap-0.5">
//             <FiUser size={10} /> {audio.author}
//           </span>
//           <span className="flex items-center gap-0.5">
//             <FiCalendar size={10} /> {new Date(audio.publishedAt).toLocaleDateString()}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Search Bar ──────────────────────────────────────────────
// const SearchBar = ({ value, onChange }) => (
//   <div className="relative w-full sm:max-w-md">
//     <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
//     <input
//       type="text"
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       placeholder="Search episodes, authors, topics…"
//       className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-full border border-gray-200 dark:border-zinc-700
//                  bg-white dark:bg-zinc-800 text-sm text-black dark:text-white
//                  placeholder-gray-400 dark:placeholder-gray-500
//                  transition-colors duration-200
//                  outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//     />
//     {value && (
//       <button
//         type="button"
//         onClick={() => onChange('')}
//         aria-label="Clear search"
//         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
//                    dark:hover:text-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full p-0.5"
//       >
//         <FiX size={16} />
//       </button>
//     )}
//   </div>
// );

// // ─── Main Component ─────────────────────────────────────────
// const AudioPage = () => {
//   const [audioList, setAudioList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');

//   // Player state
//   const [selectedAudio, setSelectedAudio] = useState(null);
//   const [isPlayerOpen, setIsPlayerOpen] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [progress, setProgress] = useState({ current: 0, duration: 0 });
//   const audioRef = useRef(null);

//   const fetchAudio = useCallback(async (pageNum = 1) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await api.get('/api/audio', { params: { page: pageNum, limit: 12 } });
//       if (res.data.success) {
//         setAudioList(res.data.data);
//         setTotalPages(res.data.pagination.totalPages);
//       } else {
//         setError(res.data.message || 'Failed to load audio');
//       }
//     } catch (err) {
//       console.error('Fetch audio error:', err);
//       setError('Failed to load audio. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchAudio(page);
//   }, [page, fetchAudio]);

//   const filteredAudioList = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return audioList;
//     return audioList.filter((a) =>
//       [a.title, a.description, a.author]
//         .filter(Boolean)
//         .some((field) => field.toLowerCase().includes(q))
//     );
//   }, [audioList, search]);

//   // ─── Player handlers ─────────────────────────────────────
//   const openPlayer = (audio) => {
//     setSelectedAudio(audio);
//     setIsPlayerOpen(true);
//     // Reset progress
//     setProgress({ current: 0, duration: 0 });
//   };

//   const closePlayer = () => {
//     setIsPlayerOpen(false);
//     setSelectedAudio(null);
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current.currentTime = 0;
//     }
//     setIsPlaying(false);
//     setIsLoading(false);
//   };

//   const handleToggle = () => {
//     const el = audioRef.current;
//     if (!el) return;
//     if (isPlaying) {
//       el.pause();
//     } else {
//       setIsLoading(true);
//       const playPromise = el.play();
//       if (playPromise) playPromise.catch(() => setIsLoading(false));
//     }
//   };

//   const handleSeek = (e) => {
//     const el = audioRef.current;
//     if (!el || !progress.duration) return;
//     const rect = e.currentTarget.getBoundingClientRect();
//     const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
//     el.currentTime = ratio * progress.duration;
//   };

//   // ─── Audio element events ──────────────────────────────
//   useEffect(() => {
//     const el = audioRef.current;
//     if (!el) return;

//     const onPlay = () => {
//       setIsPlaying(true);
//       setIsLoading(false);
//     };
//     const onPause = () => setIsPlaying(false);
//     const onWaiting = () => setIsLoading(true);
//     const onCanPlay = () => setIsLoading(false);
//     const onEnded = () => setIsPlaying(false);
//     const onTimeUpdate = () =>
//       setProgress({ current: el.currentTime, duration: el.duration || 0 });
//     const onLoadedMeta = () =>
//       setProgress((p) => ({ ...p, duration: el.duration || 0 }));

//     el.addEventListener('play', onPlay);
//     el.addEventListener('pause', onPause);
//     el.addEventListener('waiting', onWaiting);
//     el.addEventListener('canplay', onCanPlay);
//     el.addEventListener('ended', onEnded);
//     el.addEventListener('timeupdate', onTimeUpdate);
//     el.addEventListener('loadedmetadata', onLoadedMeta);

//     return () => {
//       el.removeEventListener('play', onPlay);
//       el.removeEventListener('pause', onPause);
//       el.removeEventListener('waiting', onWaiting);
//       el.removeEventListener('canplay', onCanPlay);
//       el.removeEventListener('ended', onEnded);
//       el.removeEventListener('timeupdate', onTimeUpdate);
//       el.removeEventListener('loadedmetadata', onLoadedMeta);
//     };
//   }, [selectedAudio]);

//   // When selectedAudio changes, reset progress and optionally preload
//   useEffect(() => {
//     if (selectedAudio) {
//       const media = extractMediaSrc(selectedAudio.embedCode);
//       if (media?.type === 'media') {
//         // audioRef will be attached later
//       }
//     }
//   }, [selectedAudio]);

//   // ─── Extract media for the overlay ──────────────────────
//   const selectedMedia = selectedAudio ? extractMediaSrc(selectedAudio.embedCode) : null;
//   const sanitizedIframe = useMemo(() => {
//     if (selectedMedia?.type !== 'iframe') return null;
//     return DOMPurify.sanitize(selectedMedia.raw, {
//       ADD_TAGS: ['iframe'],
//       ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
//     });
//   }, [selectedMedia]);

//   // ─── Render ──────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-white dark:bg-zinc-900 py-6 sm:py-10 md:py-12 px-3 sm:px-6">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-6 sm:mb-10">
//           <div className="flex items-center gap-2 sm:gap-3 mb-2">
//             <div className="p-1.5 sm:p-2 bg-black dark:bg-white rounded-lg">
//               <FiHeadphones className="text-white dark:text-black" size={18} />
//             </div>
//             <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[4px] text-red-500">Listen</span>
//           </div>
//           <h1 className="text-[clamp(1.75rem,6vw,3rem)] font-bold text-black dark:text-white leading-tight">
//             Audio Library
//           </h1>
//           <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-prose">
//             Explore our latest episodes and audio content – tap any card to listen.
//           </p>
//           <div className="mt-4 sm:mt-5">
//             <SearchBar value={search} onChange={setSearch} />
//           </div>
//         </div>

//         {/* Content */}
//         {loading ? (
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
//             {[...Array(8)].map((_, i) => (
//               <SkeletonCard key={i} />
//             ))}
//           </div>
//         ) : error ? (
//           <div className="text-center py-12">
//             <p className="text-red-500 dark:text-red-400">{error}</p>
//             <button
//               onClick={() => fetchAudio(page)}
//               className="mt-4 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
//             >
//               Retry
//             </button>
//           </div>
//         ) : audioList.length === 0 ? (
//           <div className="text-center py-12">
//             <div className="text-5xl mb-3">🎧</div>
//             <p className="text-lg text-gray-500 dark:text-gray-400">No audio content yet.</p>
//             <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for new episodes.</p>
//           </div>
//         ) : filteredAudioList.length === 0 ? (
//           <div className="text-center py-12">
//             <div className="text-5xl mb-3">🔍</div>
//             <p className="text-lg text-gray-500 dark:text-gray-400">No results for "{search}".</p>
//             <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term.</p>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
//               {filteredAudioList.map((audio) => (
//                 <AudioCard key={audio._id} audio={audio} onClick={openPlayer} />
//               ))}
//             </div>

//             {/* Pagination */}
//             {totalPages > 1 && !search && (
//               <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8">
//                 <button
//                   onClick={() => setPage((p) => Math.max(p - 1, 1))}
//                   disabled={page === 1}
//                   className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
//                 >
//                   Previous
//                 </button>
//                 <span className="px-2 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 tabular-nums">
//                   {page} / {totalPages}
//                 </span>
//                 <button
//                   onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
//                   disabled={page === totalPages}
//                   className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* ─── Player Overlay ────────────────────────────────── */}
//       <AudioPlayerOverlay
//         audio={selectedAudio}
//         isOpen={isPlayerOpen}
//         onClose={closePlayer}
//         media={selectedMedia}
//         sanitizedIframe={sanitizedIframe}
//         audioRef={audioRef}
//         isPlaying={isPlaying}
//         isLoading={isLoading}
//         progress={progress}
//         handleToggle={handleToggle}
//         handleSeek={handleSeek}
//       />

//       <style jsx>{`
//         @keyframes eq {
//           0%, 100% { height: 4px; }
//           50% { height: 12px; }
//         }
//         .audio-embed-container iframe {
//           width: 100%;
//           max-width: 100%;
//           height: 100px;
//           border: 0;
//         }
//         @media (min-width: 640px) {
//           .audio-embed-container iframe {
//             height: 120px;
//           }
//         }
//         @media (min-width: 768px) {
//           .audio-embed-container iframe {
//             height: 152px;
//           }
//         }
//         @media (prefers-reduced-motion: reduce) {
//           * {
//             animation-duration: 0.001ms !important;
//             transition-duration: 0.001ms !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default AudioPage;
















import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import API from '../utils/api';
import {
  FiClock, FiCalendar, FiUser, FiPlay, FiPause, FiHeadphones,
  FiSearch, FiX, FiLoader, FiVolume2, FiVolumeX, FiSkipBack, FiSkipForward
} from 'react-icons/fi';
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

// ─── Skeleton ──────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700">
    <div className="aspect-square bg-gray-300 dark:bg-zinc-700" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-full" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/2" />
    </div>
  </div>
);

// ─── Tiny equalizer bars (only for media) ──────────────────
const EqBars = () => (
  <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-[3px] bg-red-500 rounded-full animate-[eq_0.9s_ease-in-out_infinite]"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// ─── Advanced Popup Player ──────────────────────────────
const AudioPlayerOverlay = ({
  audio,
  isOpen,
  onClose,
  media,
  sanitizedIframe,
  audioRef,
  isPlaying,
  isLoading,
  progress,
  handleToggle,
  handleSeek,
  volume,
  setVolume,
  isMuted,
  toggleMute,
  nextTrack,
  prevTrack,
  hasNext,
  hasPrev,
}) => {
  if (!isOpen || !audio) return null;

  const isIframe = media?.type === 'iframe';
  const isMedia = media?.type === 'media';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/70 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto relative transition-transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
          aria-label="Close player"
        >
          <FiX size={22} />
        </button>

        <div className="p-4 sm:p-6">
          {/* Cover image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-lg mb-4">
            <img
              src={audio.coverImage || 'https://via.placeholder.com/400x400/111111/FFFFFF?text=No+Image'}
              alt={audio.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x400/111111/FFFFFF?text=No+Image';
              }}
            />
          </div>

          {/* Title & metadata */}
          <div className="text-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white line-clamp-2">
              {audio.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {audio.description}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="flex items-center gap-1"><FiUser size={12} /> {audio.author}</span>
              <span className="flex items-center gap-1"><FiCalendar size={12} /> {new Date(audio.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Player controls */}
          <div className="mt-2">
            {isMedia ? (
              <>
                <audio ref={audioRef} src={media.src} preload="none" className="hidden" />

                {/* Progress bar */}
                {progress.duration > 0 && (
                  <div className="mb-3">
                    <div
                      role="slider"
                      aria-label="Seek"
                      aria-valuemin={0}
                      aria-valuemax={progress.duration}
                      aria-valuenow={progress.current}
                      tabIndex={0}
                      onClick={handleSeek}
                      className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-700 cursor-pointer overflow-hidden group transition-colors"
                    >
                      <div
                        className="h-full bg-red-500 rounded-full transition-[width] duration-150 group-hover:bg-red-400"
                        style={{ width: `${(progress.current / progress.duration) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatTime(progress.current)}</span>
                      <span>{formatTime(progress.duration)}</span>
                    </div>
                  </div>
                )}

                {/* Playback controls */}
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  <button
                    onClick={prevTrack}
                    disabled={!hasPrev}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Previous"
                  >
                    <FiSkipBack size={20} />
                  </button>

                  <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className="p-4 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 shadow-lg"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading ? (
                      <FiLoader size={24} className="animate-spin" />
                    ) : isPlaying ? (
                      <FiPause size={24} />
                    ) : (
                      <FiPlay size={24} />
                    )}
                  </button>

                  <button
                    onClick={nextTrack}
                    disabled={!hasNext}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Next"
                  >
                    <FiSkipForward size={20} />
                  </button>
                </div>

                {/* Volume control */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={toggleMute}
                    className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 sm:w-32 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                {/* Now playing indicator */}
                {isPlaying && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-red-500">
                    <EqBars />
                    <span>Now playing</span>
                  </div>
                )}
              </>
            ) : isIframe ? (
              <div
                className="audio-embed-container rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: sanitizedIframe }}
              />
            ) : (
              <p className="text-red-500 text-sm text-center">Unable to load audio.</p>
            )}
          </div>
        </div>
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
        /* Custom range input for volume */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
          border: none;
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

// ─── Individual Audio Card ────────────────────────────────
const AudioCard = ({ audio, onClick }) => {
  const coverUrl = audio.coverImage || 'https://via.placeholder.com/200x200/111111/FFFFFF?text=No+Image';

  return (
    <div
      onClick={() => onClick(audio)}
      className="bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700
                 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={coverUrl}
          alt={audio.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x200/111111/FFFFFF?text=No+Image';
          }}
        />
      </div>
      <div className="p-2.5 sm:p-3">
        <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white line-clamp-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
          {audio.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
          {audio.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          <span className="flex items-center gap-0.5"><FiUser size={10} /> {audio.author}</span>
          <span className="flex items-center gap-0.5"><FiCalendar size={10} /> {new Date(audio.publishedAt).toLocaleDateString()}</span>
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

  // Player state
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const currentIndexRef = useRef(0);

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

  // ─── Player handlers ─────────────────────────────────────
  const openPlayer = (audio) => {
    setSelectedAudio(audio);
    setIsPlayerOpen(true);
    currentIndexRef.current = filteredAudioList.indexOf(audio);
    setProgress({ current: 0, duration: 0 });
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedAudio(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleToggle = () => {
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

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const goToTrack = (direction) => {
    const list = filteredAudioList;
    const idx = currentIndexRef.current + direction;
    if (idx < 0 || idx >= list.length) return;
    const next = list[idx];
    if (next) {
      setSelectedAudio(next);
      currentIndexRef.current = idx;
      setProgress({ current: 0, duration: 0 });
      // Reset audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsLoading(false);
        // The audio element will load the new src when the component re-renders with the new selectedAudio
        // We need to trigger a re-render of the overlay with the new audio, which already happens via state.
        // The audio element is controlled by the overlay, which uses the new selectedAudio.
        // To force the audio element to load the new src, we'll use a key change or reset the src.
        // Since the audio element is inside the overlay, it will re-mount when selectedAudio changes (if we use a key).
        // We'll add a key to the overlay or audio element.
      }
    }
  };

  // ─── Audio element events ──────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

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
    const onLoadedMeta = () => {
      setProgress((p) => ({ ...p, duration: el.duration || 0 }));
      // Sync volume
      if (el.volume !== undefined) {
        el.volume = volume;
      }
    };

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
  }, [selectedAudio, volume]);

  // Sync volume when changed
  useEffect(() => {
    const el = audioRef.current;
    if (el && !isMuted) {
      el.volume = volume;
    }
  }, [volume, isMuted]);

  // ─── Extract media for the overlay ──────────────────────
  const selectedMedia = selectedAudio ? extractMediaSrc(selectedAudio.embedCode) : null;
  const sanitizedIframe = useMemo(() => {
    if (selectedMedia?.type !== 'iframe') return null;
    return DOMPurify.sanitize(selectedMedia.raw, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
    });
  }, [selectedMedia]);

  // ─── Render ──────────────────────────────────────────────
  const list = filteredAudioList;
  const currentIdx = list.indexOf(selectedAudio);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < list.length - 1;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-6 sm:py-10 md:py-12 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto">
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
            Explore our latest episodes and audio content – tap any card to listen.
          </p>
          <div className="mt-4 sm:mt-5">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchAudio(page)}
              className="mt-4 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredAudioList.map((audio) => (
                <AudioCard key={audio._id} audio={audio} onClick={openPlayer} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !search && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
                >
                  Previous
                </button>
                <span className="px-2 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 dark:border-zinc-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Player Overlay ────────────────────────────────── */}
      <AudioPlayerOverlay
        key={selectedAudio?._id || 'player'}
        audio={selectedAudio}
        isOpen={isPlayerOpen}
        onClose={closePlayer}
        media={selectedMedia}
        sanitizedIframe={sanitizedIframe}
        audioRef={audioRef}
        isPlaying={isPlaying}
        isLoading={isLoading}
        progress={progress}
        handleToggle={handleToggle}
        handleSeek={handleSeek}
        volume={volume}
        setVolume={setVolume}
        isMuted={isMuted}
        toggleMute={toggleMute}
        nextTrack={() => goToTrack(1)}
        prevTrack={() => goToTrack(-1)}
        hasNext={hasNext}
        hasPrev={hasPrev}
      />

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
        /* Custom range input for volume */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
          border: none;
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
