import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiTag,
  FiClock,
  FiPlay,
  FiPause,
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiLink,
  FiArrowUp,
  FiBookOpen,
  FiMessageCircle,
  FiHeart,
  FiCornerUpLeft,
  FiTrash2,
  FiSend,
  FiBookmark,
  FiList,
} from 'react-icons/fi';
import API from '../utils/api';

// ─── Design tokens (neutralised) ───────────────────
const TOKENS = {
  '--paper': '#ffffff',
  '--paper-dim': '#f5f5f5',
  '--ink': '#000000',
  '--ink-soft': '#333333',
  '--ink-faint': '#777777',
  '--accent': '#333333',
  '--accent-soft': '#eaeaea',
  '--gold': '#888888',
  '--rule': '#e0e0e0',
};

// ─── Helpers ───────────────────────────────────────────
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${base}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
};

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

const getReadingStats = (text) => {
  if (!text) return { minutes: 1, words: 0 };
  const words = text.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return { minutes: Math.ceil(words / 200) || 1, words };
};

const injectHeadingIds = (html) => {
  if (!html) return { html: '', toc: [] };
  const toc = [];
  let counter = 0;
  const withIds = html.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    counter += 1;
    const text = inner.replace(/<[^>]*>/g, '').trim();
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `section`;
    const id = `${slug}-${counter}`;
    toc.push({ id, text, level: tag });
    const hasId = /id\s*=/.test(attrs);
    const newAttrs = hasId ? attrs : `${attrs} id="${id}"`;
    return `<${tag}${newAttrs}>${inner}</${tag}>`;
  });
  return { html: withIds, toc };
};

const updateCommentRecursively = (comments, id, updater) => {
  return comments.map((c) => {
    if (c._id === id) return updater(c);
    if (c.replies && c.replies.length) {
      return { ...c, replies: updateCommentRecursively(c.replies, id, updater) };
    }
    return c;
  });
};

const addReplyRecursively = (comments, parentId, reply) => {
  return comments.map((c) => {
    if (c._id === parentId) {
      return { ...c, replies: [...(c.replies || []), reply] };
    }
    if (c.replies && c.replies.length) {
      return { ...c, replies: addReplyRecursively(c.replies, parentId, reply) };
    }
    return c;
  });
};

const deleteCommentRecursively = (comments, id) => {
  return comments
    .filter((c) => c._id !== id)
    .map((c) => ({
      ...c,
      replies: c.replies ? deleteCommentRecursively(c.replies, id) : [],
    }));
};

const normalizeLikes = (comment) => {
  return {
    ...comment,
    likes: Array.isArray(comment.likes) ? comment.likes.length : comment.likes || 0,
    replies: comment.replies ? comment.replies.map(normalizeLikes) : [],
  };
};

// ─── Comment Item Component ────────────────────────────
const CommentItem = ({ comment, onReply, onLike, onDelete, currentUser, isRoot = false }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplyClick = () => {
    if (!currentUser) {
      toast.error('Log in to reply to comments', {
        action: {
          label: 'Log in',
          onClick: () => window.location.href = '/login',
        },
        duration: 4000,
      });
      return;
    }
    setShowReplyForm(!showReplyForm);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment._id, replyText);
      setReplyText('');
      setShowReplyForm(false);
    } catch {
      toast.error('Reply failed to send');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeClick = () => {
    if (!currentUser) {
      toast.error('Log in to like comments', {
        action: {
          label: 'Log in',
          onClick: () => window.location.href = '/login',
        },
        duration: 4000,
      });
      return;
    }
    onLike(comment._id);
  };

  const authorDisplay = comment.author?.fullname || comment.author?.username || 'Anonymous';
  const avatarUrl = comment.author?.avatar ? getAvatarUrl(comment.author.avatar) : null;
  const isOwnComment = currentUser?._id === comment.author?._id;

  return (
    <div className="border-b border-[var(--rule)] last:border-0 py-4 sm:py-5">
      <div className="flex gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={authorDisplay}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-[var(--rule)]"
          />
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-semibold text-sm flex-shrink-0">
            {authorDisplay.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-[var(--ink)] text-sm">{authorDisplay}</span>
            <span className="text-xs text-[var(--ink-faint)]">
              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {isOwnComment && (
              <button
                onClick={() => onDelete(comment._id)}
                className="text-[var(--ink-faint)] hover:text-[var(--accent)] text-xs ml-auto"
                aria-label="Delete comment"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
          <p className="text-[var(--ink)] text-sm mt-1.5 break-words leading-relaxed">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--accent)]"
            >
              <FiHeart size={14} className={comment.liked ? 'fill-[var(--accent)] text-[var(--accent)]' : ''} />
              <span>{comment.likes || 0}</span>
            </button>
            {isRoot && (
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                <FiCornerUpLeft size={14} />
                <span>Reply</span>
              </button>
            )}
          </div>

          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 px-3 py-2 border border-[var(--rule)] bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                disabled={submitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="px-3 py-2 bg-[var(--ink)] text-white rounded-md text-sm hover:bg-[var(--accent)] disabled:opacity-40"
              >
                {submitting ? '…' : <FiSend size={15} />}
              </button>
            </form>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 sm:ml-6 mt-3 pl-3 sm:pl-4 border-l-2 border-[var(--rule)] space-y-1">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  currentUser={currentUser}
                  isRoot={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────
const PostDetail = () => {
  const { id, slug } = useParams();
  const postIdentifier = slug || id;
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [showBackToTop, setShowBackToTop] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [readProgress, setReadProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const articleRef = useRef(null);
  const autoPlayRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentSort, setCommentSort] = useState('newest');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/posts/${postIdentifier}`);
        const postData = res.data.data;
        setPost(postData);

        if (postData.category) {
          const relatedRes = await api.get('/api/posts', {
            params: { category: postData.category, limit: 3, page: 1 },
          });
          const related = relatedRes.data.data.filter((p) => p._id !== postData._id);
          setRelatedPosts(related);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.response?.status === 404 ? 'Post not found' : 'Failed to load post');
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    if (postIdentifier) fetchPost();
  }, [postIdentifier]);

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/api/posts/${postIdentifier}/comments`);
      const normalized = (res.data.data || []).map((c) => normalizeLikes(c));
      setComments(normalized);
    } catch (err) {
      console.error('Error fetching comments:', err);
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [postIdentifier]);

  useEffect(() => {
    if (postIdentifier) fetchComments();
  }, [postIdentifier, fetchComments]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (commentSort === 'liked') {
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [comments, commentSort]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/posts/${postIdentifier}/comments`, { content: commentText });
      const newComment = normalizeLikes(res.data.data);
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Comment failed to send');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (commentId, content) => {
    try {
      const res = await api.post(`/api/comments/${commentId}/replies`, { content });
      const newReply = normalizeLikes(res.data.data);
      setComments((prev) => addReplyRecursively(prev, commentId, newReply));
      toast.success('Reply posted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reply failed to send');
      throw err;
    }
  };

  const handleLike = async (commentId) => {
    try {
      const res = await api.post(`/api/comments/${commentId}/like`);
      const { liked, likes } = res.data.data;
      setComments((prev) =>
        updateCommentRecursively(prev, commentId, (c) => ({
          ...c,
          likes,
          liked,
        }))
      );
    } catch (err) {
      console.error('Like error:', err);
      toast.error('Like failed to send');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments((prev) => deleteCommentRecursively(prev, commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  // useEffect(() => {
  //   const handleScroll = () => setShowBackToTop(window.scrollY > 500);
  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  useEffect(() => {
    const handleReadProgress = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) * 100 : 0;
      setReadProgress(pct);
    };
    window.addEventListener('scroll', handleReadProgress, { passive: true });
    handleReadProgress();
    return () => window.removeEventListener('scroll', handleReadProgress);
  }, [post]);

  const goToImage = useCallback(
    (index) => {
      if (!post || !post.images || !Array.isArray(post.images) || post.images.length === 0) return;
      setCurrentImageIndex(Math.min(index, post.images.length - 1));
      setProgress(0);
    },
    [post]
  );

  const handleImagePrev = useCallback(() => {
    if (!post || !post.images || !Array.isArray(post.images) || post.images.length === 0) return;
    const newIndex = currentImageIndex === 0 ? post.images.length - 1 : currentImageIndex - 1;
    goToImage(newIndex);
  }, [currentImageIndex, post, goToImage]);

  const handleImageNext = useCallback(() => {
    if (!post || !post.images || !Array.isArray(post.images) || post.images.length === 0) return;
    const newIndex = currentImageIndex === post.images.length - 1 ? 0 : currentImageIndex + 1;
    goToImage(newIndex);
  }, [currentImageIndex, post, goToImage]);

  useEffect(() => {
    if (!post || !post.images || !Array.isArray(post.images) || post.images.length <= 1) return;
    if (autoPlay) {
      const interval = 3000;
      let startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / interval) * 100, 100);
        setProgress(newProgress);
        if (newProgress >= 100) {
          handleImageNext();
          startTime = Date.now();
        }
        autoPlayRef.current = requestAnimationFrame(tick);
      };
      autoPlayRef.current = requestAnimationFrame(tick);
    } else {
      if (autoPlayRef.current) {
        cancelAnimationFrame(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      setProgress(0);
    }
    return () => {
      if (autoPlayRef.current) {
        cancelAnimationFrame(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [autoPlay, post, handleImageNext]);

  const handleMouseEnter = () => setAutoPlay(false);
  const handleMouseLeave = () => setAutoPlay(true);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchMove = (e) => setTouchEndX(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (!post || !post.images || !Array.isArray(post.images) || post.images.length === 0) return;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? handleImageNext() : handleImagePrev();
    }
    setTouchStartX(0);
    setTouchEndX(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!post || !post.images || !Array.isArray(post.images) || post.images.length <= 1) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleImagePrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleImageNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, handleImagePrev, handleImageNext]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || 'Check out this post';
  const shareOnFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  const shareOnTwitter = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  const shareOnLinkedIn = () =>
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied');
  };

  const toggleBookmark = () => {
    setBookmarked((prev) => {
      const next = !prev;
      toast.success(next ? 'Saved for later' : 'Removed from saved');
      return next;
    });
  };

  // const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const { html: descriptionHtml, toc } = useMemo(
    () => injectHeadingIds(post?.description || ''),
    [post?.description]
  );
  const readingStats = useMemo(() => getReadingStats(post?.description || ''), [post?.description]);

  if (loading) {
    return (
      <div style={TOKENS} className="min-h-screen bg-[var(--paper)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-3 w-24 bg-[var(--paper-dim)] rounded" />
            <div className="h-10 w-3/4 bg-[var(--paper-dim)] rounded" />
            <div className="h-4 w-1/2 bg-[var(--paper-dim)] rounded" />
            <div className="h-72 w-full bg-[var(--paper-dim)] rounded" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-[var(--paper-dim)] rounded" />
              <div className="h-4 w-full bg-[var(--paper-dim)] rounded" />
              <div className="h-4 w-2/3 bg-[var(--paper-dim)] rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={TOKENS} className="min-h-screen bg-[var(--paper)] flex items-center">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="text-5xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-[var(--ink)]">{error || 'Post not found'}</h2>
          <p className="text-[var(--ink-soft)] mt-2">
            The story you're looking for doesn't exist or has been taken down.
          </p>
          <Link
            to="/news"
            className="inline-block mt-6 px-6 py-2.5 border-2 border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] font-medium"
          >
            ← Back to News
          </Link>
        </div>
      </div>
    );
  }

  const { title, category, images = [], author, authorName, createdAt, isPublished } = post;
  const authorDisplay = authorName || author?.fullname || 'Unknown Author';
  const avatarUrl = author?.avatar ? getAvatarUrl(author.avatar) : null;
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const hasMultipleImages = Array.isArray(images) && images.length > 1;

  return (
    <div style={TOKENS} className="min-h-screen bg-[var(--paper)]">
      {/* ─── Reading progress rail ─────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[var(--paper-dim)] z-40">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${readProgress}%` }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm font-medium"
          >
            <FiArrowLeft size={18} />
            <span>Back</span>
          </button>
          <button
            onClick={toggleBookmark}
            className="flex items-center gap-2 text-sm font-medium border border-[var(--rule)] px-3 py-1.5 rounded-full text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <FiBookmark size={15} className={bookmarked ? 'fill-[var(--accent)] text-[var(--accent)]' : ''} />
            <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save for later'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* ─── Main Content ────────────────────────────── */}
          <div className="lg:col-span-8">
            <article ref={articleRef}>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-sm">
                  {category}
                </span>
                {!isPublished && (
                  <span className="text-xs font-medium bg-[var(--paper-dim)] text-[var(--ink-soft)] px-2.5 py-1 rounded-sm">
                    Draft
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[var(--ink)] leading-[1.12]">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-sm text-[var(--ink-soft)] border-y border-[var(--rule)] py-3">
                <span className="flex items-center gap-1.5"><FiCalendar size={15} />{date}</span>
                <span className="flex items-center gap-1.5"><FiUser size={15} />{authorDisplay}</span>
                <span className="flex items-center gap-1.5"><FiClock size={15} />{readingStats.minutes} min · {readingStats.words.toLocaleString()} words</span>
              </div>

              {/* Share buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mt-4">
                <span className="text-xs text-[var(--ink-faint)] uppercase tracking-wide mr-1">Share</span>
                <button onClick={shareOnFacebook} aria-label="Share on Facebook" className="w-8 h-8 rounded-full border border-[var(--rule)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"><FiFacebook size={15} /></button>
                <button onClick={shareOnTwitter} aria-label="Share on X" className="w-8 h-8 rounded-full border border-[var(--rule)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-[#111] hover:text-white hover:border-[#111]"><FiTwitter size={15} /></button>
                <button onClick={shareOnLinkedIn} aria-label="Share on LinkedIn" className="w-8 h-8 rounded-full border border-[var(--rule)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"><FiLinkedin size={15} /></button>
                <button onClick={copyLink} aria-label="Copy link" className="w-8 h-8 rounded-full border border-[var(--rule)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--ink)] hover:text-white hover:border-[var(--ink)]"><FiLink size={15} /></button>
              </div>

              {/* Image Gallery */}
              {Array.isArray(images) && images.length > 0 && (
                <div
                  className="mt-6 relative group"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="overflow-hidden bg-[var(--paper-dim)]">
                    <img
                      src={images[currentImageIndex] || images[0]}
                      alt={title}
                      className="w-full h-56 xs:h-64 sm:h-80 md:h-[26rem] object-cover"
                    />
                  </div>
                  {hasMultipleImages && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                      <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                  {hasMultipleImages && (
                    <button
                      onClick={() => setAutoPlay(!autoPlay)}
                      aria-label={autoPlay ? 'Pause slideshow' : 'Play slideshow'}
                      className="absolute top-3 left-3 bg-black/70 text-white p-1.5 rounded-sm hover:bg-black/90"
                    >
                      {autoPlay ? <FiPause size={17} /> : <FiPlay size={17} />}
                    </button>
                  )}
                  {hasMultipleImages && (
                    <>
                      {/* <button
                        onClick={handleImagePrev}
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--ink)] w-9 h-9 rounded-full shadow-md flex items-center justify-center text-lg"
                      >
                        ‹
                      </button>
                      <button
                        onClick={handleImageNext}
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--ink)] w-9 h-9 rounded-full shadow-md flex items-center justify-center text-lg"
                      >
                        ›
                      </button> */}
                    </>
                  )}
                  {hasMultipleImages && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToImage(idx)}
                          aria-label={`Go to image ${idx + 1}`}
                          className={`flex-shrink-0 w-16 h-16 border-2 overflow-hidden ${
                            idx === currentImageIndex ? 'border-[var(--accent)]' : 'border-transparent'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile table of contents */}
              {toc.length > 0 && (
                <div className="mt-6 lg:hidden border border-[var(--rule)] rounded-sm p-4 bg-[var(--paper-dim)]/50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)] mb-2">
                    <FiList size={16} /> In this article
                  </div>
                  <ul className="space-y-1.5">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 'h3' ? 'ml-4' : ''}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className="text-sm text-[var(--ink-soft)] hover:text-[var(--accent)] text-left"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ─── Description (HTML content) ────────────── */}
              <div
                className="mt-8 prose prose-lg max-w-none text-[var(--ink)] prose-p:leading-[1.8] prose-hr:my-8 prose-hr:border-[var(--rule)]"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />

              {/* ─── Author Bio ────────────────────────────── */}
              <div className="mt-10 p-5 bg-[var(--paper-dim)] border-l-2 border-[var(--accent)] flex items-start gap-4 rounded-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={authorDisplay} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-semibold text-lg flex-shrink-0">
                    {authorDisplay.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">Written by</p>
                  <h4 className="font-bold text-[var(--ink)] mt-0.5 text-lg">{authorDisplay}</h4>
                  <p className="text-sm text-[var(--ink-soft)] mt-1">{author?.bio || 'Writer and storyteller.'}</p>
                  {author?.email && <p className="text-xs text-[var(--ink-faint)] mt-1">{author.email}</p>}
                </div>
              </div>

              {/* ─── Comment Section ────────────────────────── */}
              <div className="mt-12 border-t border-[var(--rule)] pt-8">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2 text-[var(--ink)]">
                    <FiMessageCircle size={22} />
                    Comments <span className="text-[var(--ink-faint)] font-normal text-lg">({comments.length})</span>
                  </h3>
                  {comments.length > 1 && (
                    <div className="flex items-center gap-1 text-sm bg-[var(--paper-dim)] rounded-full p-1">
                      <button
                        onClick={() => setCommentSort('newest')}
                        className={`px-3 py-1 rounded-full ${commentSort === 'newest' ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)]'}`}
                      >
                        Newest
                      </button>
                      <button
                        onClick={() => setCommentSort('liked')}
                        className={`px-3 py-1 rounded-full ${commentSort === 'liked' ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)]'}`}
                      >
                        Most liked
                      </button>
                    </div>
                  )}
                </div>

                {currentUser ? (
                  <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts…"
                      className="flex-1 px-4 py-2.5 border border-[var(--rule)] bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      required
                      disabled={submittingComment}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="px-4 py-2.5 bg-[var(--ink)] text-white rounded-md text-sm font-semibold hover:bg-[var(--accent)] disabled:opacity-40 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <FiSend size={16} />
                      Post
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-[var(--ink-soft)] mb-6">
                    <Link to="/login" className="text-[var(--accent)] font-medium hover:underline">Log in</Link> to leave a comment.
                  </p>
                )}

                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((n) => (
                      <div key={n} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-[var(--paper-dim)]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 bg-[var(--paper-dim)] rounded" />
                          <div className="h-3 w-full bg-[var(--paper-dim)] rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-[var(--ink-soft)] text-sm">No comments yet — share your thoughts first.</p>
                ) : (
                  <div className="space-y-1">
                    {sortedComments.map((comment) => (
                      <CommentItem
                        key={comment._id}
                        comment={comment}
                        onReply={handleReply}
                        onLike={handleLike}
                        onDelete={handleDelete}
                        currentUser={currentUser}
                        isRoot={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* ─── Sidebar ──────────────────────────────────── */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-8">
              {toc.length > 0 && (
                <div className="hidden lg:block border border-[var(--rule)] rounded-sm p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)] mb-3">
                    <FiList size={16} /> In this article
                  </div>
                  <ul className="space-y-2 border-l border-[var(--rule)]">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 'h3' ? 'pl-6' : 'pl-3'}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className="text-sm text-[var(--ink-soft)] hover:text-[var(--accent)] text-left"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-[var(--paper-dim)] border border-[var(--rule)] rounded-sm">
                <div className="flex items-center gap-2">
                  <FiBookOpen className="text-[var(--accent)]" size={19} />
                  <span className="font-semibold text-[var(--ink)] text-sm">{readingStats.minutes} min read</span>
                </div>
                <p className="text-xs text-[var(--ink-soft)] mt-1">{readingStats.words.toLocaleString()} words · approximate reading time.</p>
              </div>

              {relatedPosts.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 border-b border-[var(--rule)] pb-2 text-[var(--ink)]">
                    Related Posts
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.map((related) => (
                      <Link
                        key={related._id}
                        to={`/news/${related.slug || related._id}`}
                        className="group block"
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-[var(--paper-dim)]">
                            <img
                              src={related.images?.[0] || 'https://via.placeholder.com/80'}
                              alt={related.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">{related.category}</p>
                            <h4 className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] line-clamp-2 mt-0.5">
                              {related.title}
                            </h4>
                            <p className="text-xs text-[var(--ink-faint)] mt-1">{new Date(related.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Back to Top ────────────────────────────────── */}
      {/* {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 bg-[var(--ink)] text-white p-3 rounded-full shadow-lg hover:bg-[var(--accent)] z-40"
        >
          <FiArrowUp size={20} />
        </button>
      )} */}
    </div>
  );
};

export default PostDetail;