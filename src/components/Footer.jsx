import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaPinterest,
  FaChevronDown,
  FaChevronUp,
  FaArrowUp,
  FaPaperPlane,
} from "react-icons/fa";
import { FiClock, FiCalendar, FiFeather } from "react-icons/fi";
import axios from "axios";
import API from "@/utils/api";
import { FaXTwitter } from "react-icons/fa6";

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

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  // ─── Recent posts state ──────────────────────────────
  const [recentPosts, setRecentPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);

  // ─── Fetch recent posts ──────────────────────────────
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        setPostsLoading(true);
        setPostsError(null);
        const res = await api.get('/api/posts', {
          params: { limit: 3, page: 1, sort: 'desc' }
        });
        setRecentPosts(res.data.data || []);
      } catch (err) {
        console.error('Error fetching recent posts:', err);
        setPostsError('Failed to load recent stories');
      } finally {
        setPostsLoading(false);
      }
    };
    fetchRecentPosts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setSubscribeStatus("success");
      setEmail("");
      setIsSubmitting(false);
      setTimeout(() => setSubscribeStatus(null), 3000);
    }, 1000);
  };

  const quickLinks = [
    { label: "About Feathered Pen", link: "/about" },
    { label: "Contact Us", link: "/contact" },
    { label: "Privacy Policy", link: "/privacy" },
    { label: "Terms of Service", link: "/terms" },
    { label: "Write for Us", link: "/write-for-us" },
    { label: "Advertise", link: "/advertise" },
  ];

  const categories = [
    { label: "Travel", count: 24 },
    { label: "Food", count: 18 },
    { label: "Lifestyle", count: 32 },
    { label: "News", count: 45 },
    { label: "Business", count: 12 },
    { label: "Fashion", count: 21 },
  ];

  const accordionData = [
    { id: "quickLinks", title: "Quick Links", items: quickLinks },
    { id: "categories", title: "Categories", items: categories },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <footer className="bg-[#0a0a0a] text-gray-300 relative border-t border-white/5">
      {/* ─── Top Bar ──────────────────────────────────────── */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FiFeather className="text-2xl sm:text-3xl text-white" />
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                <span className="font-light text-white">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
                <span className="font-extrabold text-white">NEWS</span>
              </span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="text-xs sm:text-sm text-white/50 hidden sm:inline">
                Stories That Soar
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/40">
                © {new Date().getFullYear()} All Rights Reserved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Footer Content ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ── About / Brand ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2">
              <FiFeather className="text-2xl text-white" />
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                <span className="font-light text-white">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
                <span className="font-extrabold text-white">NEWS</span>
              </h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              A magazine and blog for storytellers, writers, and dreamers.
              We believe in the power of words to inspire, inform, and transform.
              Join us on a journey of discovery.
            </p>
            <div className="flex gap-3 pt-2">
              {[
                { icon: FaFacebookF, href: "#", color: "hover:bg-blue-600" },
                { icon: FaXTwitter, href: "https://x.com/feathered_pen", color: "hover:bg-sky-500" },
                { icon: FaInstagram, href: "#", color: "hover:bg-pink-600" },
                { icon: FaYoutube, href: "https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo", color: "hover:bg-red-600" },
                { icon: FaPinterest, href: "#", color: "hover:bg-red-500" },
              ].map(({ icon: Icon, href, color }, idx) => (
                <a
                  key={idx}
                  href={href}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${color} hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                  aria-label="Social link"
                >
                  <Icon className="text-[12px] sm:text-sm text-gray-400 hover:text-white transition" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.link}
                    onClick={handleLinkClick}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="text-white/20 group-hover:text-white/50 transition">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Categories ── */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {categories.map((cat, idx) => (
                <li key={idx}>
                  <Link
                    to={`/news?category=${encodeURIComponent(cat.label)}`}
                    onClick={handleLinkClick}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-white/20 group-hover:text-white/50 transition">›</span>
                      {cat.label}
                    </span>
                    <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
                      {cat.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Recent Posts (no rounded corners) ────────── */}
          <div className="lg:col-span-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Recent Stories
            </h3>

            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((_, idx) => (
                  <div key={idx} className="flex gap-3 items-start animate-pulse">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 bg-white/5" />
                      <div className="h-4 w-3/4 bg-white/5" />
                      <div className="h-3 w-24 bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : postsError ? (
              <p className="text-sm text-red-400">{postsError}</p>
            ) : recentPosts.length === 0 ? (
              <p className="text-sm text-gray-500">No stories yet.</p>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/news/${post.slug || post._id}`}
                    onClick={handleLinkClick}
                    className="group flex gap-3 items-start hover:bg-white/5 p-2 transition-all duration-200 -mx-2"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden bg-white/5">
                      {post.images && post.images.length > 0 ? (
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <FiFeather size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                        {post.category || 'Uncategorized'}
                      </p>
                      <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-white/30">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={10} />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Bar ────────────────────────────────────── */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/30">
              <span>© {new Date().getFullYear()} Feathered News. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link to="/privacy" onClick={handleLinkClick} className="text-white/30 hover:text-white/60 transition">
                Privacy
              </Link>
              <Link to="/terms" onClick={handleLinkClick} className="text-white/30 hover:text-white/60 transition">
                Terms
              </Link>
              <Link to="/contact" onClick={handleLinkClick} className="text-white/30 hover:text-white/60 transition">
                Contact
              </Link>
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition"
              >
                <FaArrowUp className="text-[10px]" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Floating Back to Top ──────────────────────────── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 rounded-full border border-2 right-6 bg-white text-black w-11 h-11 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl ${
          showBackToTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <FaArrowUp className="text-sm" />
      </button>
    </footer>
  );
};

export default Footer;