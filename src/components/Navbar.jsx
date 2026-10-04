
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiSearch,
  FiMenu,
  FiChevronDown,
  FiX,
  FiUser,
  FiFeather,
  FiLogIn,
  FiChevronRight,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getData } from "@/context/userContext";
import axios from "axios";
import { toast } from "sonner";
import API from "@/utils/api";
import { User } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Constants & Helpers
   ───────────────────────────────────────────────────────── */

const BEAT_PALETTE = [
  { fg: "#B91C1C", bg: "#FEF2F2" },
  { fg: "#1D4ED8", bg: "#EFF6FF" },
  { fg: "#B45309", bg: "#FFFBEB" },
  { fg: "#047857", bg: "#ECFDF5" },
  { fg: "#6D28D9", bg: "#F5F3FF" },
  { fg: "#0E7490", bg: "#ECFEFF" },
];

const beatColor = (label = "") => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return BEAT_PALETTE[Math.abs(hash) % BEAT_PALETTE.length];
};

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (/^https?:\/\//.test(avatarPath)) return avatarPath;
  const base = typeof API === "string" ? API.replace(/\/+$/, "") : "";
  return base ? `${base}/${avatarPath.replace(/^\/+/, "")}` : null;
};

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
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const api = getApiInstance();

/* ─────────────────────────────────────────────────────────
   Module-level category cache (survives remounts)
   ───────────────────────────────────────────────────────── */
let CATEGORY_CACHE = null;
const FALLBACK_CATEGORIES = ["Travel", "Food", "Lifestyle", "News", "Business", "Fashion"];

const fetchCategoriesOnce = async () => {
  if (CATEGORY_CACHE) return CATEGORY_CACHE;
  try {
    const res = await api.get("/api/posts", { params: { limit: 100, page: 1 } });
    const posts = res.data?.data || [];
    const unique = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    CATEGORY_CACHE = unique.length ? unique : FALLBACK_CATEGORIES;
  } catch {
    CATEGORY_CACHE = FALLBACK_CATEGORIES;
  }
  return CATEGORY_CACHE;
};

/* ─────────────────────────────────────────────────────────
   Small presentational bits
   ───────────────────────────────────────────────────────── */
const PillSkeleton = memo(({ w = "w-16" }) => (
  <div className={`h-7 ${w} shrink-0 rounded-full bg-gray-100 animate-pulse`} />
));
PillSkeleton.displayName = "PillSkeleton";

/* ─────────────────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────────────────── */
const Navbar = () => {
  const { user, setUser } = getData();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── State ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState(CATEGORY_CACHE || []);
  const [categoriesLoading, setCategoriesLoading] = useState(!CATEGORY_CACHE);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  /* ── Refs ── */
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const megaMenuRef = useRef(null);
  const megaTriggerRef = useRef(null);
  const megaCloseTimer = useRef(null);

  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const userRole = user?.role || "user";
  const profileRoute = userRole === "admin" ? "/admin/profile" : "/profile";

  /* ── Recent searches (localStorage) ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("recentSearches");
      if (raw) setRecentSearches(JSON.parse(raw).slice(0, 5));
    } catch {
      /* ignore */
    }
  }, []);

  const pushRecentSearch = useCallback((q) => {
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 5);
      try {
        localStorage.setItem("recentSearches", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* ── Fetch categories (cached) ── */
  useEffect(() => {
    let alive = true;
    if (!CATEGORY_CACHE) setCategoriesLoading(true);
    fetchCategoriesOnce().then((cats) => {
      if (!alive) return;
      setCategories(cats);
      setCategoriesLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* ── Nav items ── */
  const primaryNavItems = useMemo(
    () => [
      { label: "Home", link: "/" },
      { label: "News", link: "/news" },
      { label: "Listen", link: "/audio" },
    ],
    []
  );
  const secondaryNavItems = useMemo(
    () => [
      { label: "Advertise", link: "/advertise" },
      { label: "About", link: "/about" },
      { label: "Contact", link: "/contact" },
      { label: "Privacy", link: "/privacy" },
    ],
    []
  );
  const mobileNavItems = useMemo(
    () => [
      { label: "Home", link: "/" },
      { label: "News", link: "/news" },
      { label: "Listen", link: "/audio" },
      {
        label: "Categories",
        sub: categories.map((c) => ({
          label: c,
          link: `/news?category=${encodeURIComponent(c)}`,
        })),
      },
      { label: "Advertise", link: "/advertise" },
      { label: "Privacy", link: "/privacy" },
      { label: "Contact", link: "/contact" },
      { label: "About", link: "/about" },
    ],
    [categories]
  );

  /* ── Close overlays on route change ── */
  useEffect(() => {
    setSidebarOpen(false);
    setMobileOpenDropdown(null);
    setMegaMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  /* ── Outside click ── */
  useEffect(() => {
    const onDown = (e) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !menuButtonRef.current?.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
      if (
        megaMenuOpen &&
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target) &&
        !megaTriggerRef.current?.contains(e.target)
      ) {
        setMegaMenuOpen(false);
      }
      if (
        searchOpen &&
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target)
      ) {
        // Only close on outside click if query empty
        if (!searchQuery) setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [sidebarOpen, megaMenuOpen, searchOpen, searchQuery]);

  /* ── ESC closes everything ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setMobileOpenDropdown(null);
        setSearchOpen(false);
        setMegaMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ── "/" shortcut ── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        document.activeElement?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setSearchOpen(true);
        // focus after mount
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ── Focus trap for sidebar ── */
  useEffect(() => {
    if (!sidebarOpen) return;
    closeButtonRef.current?.focus();

    const onTab = (e) => {
      if (e.key !== "Tab" || !sidebarRef.current) return;
      const focusable = sidebarRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [sidebarOpen]);

  /* ── Auto-focus search ── */
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  /* ── Scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (sidebarOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [sidebarOpen]);

  /* ── Handlers ── */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((v) => !v);
    setMobileOpenDropdown(null);
  }, []);
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setMobileOpenDropdown(null);
  }, []);
  const toggleMobileDropdown = useCallback((label) => {
    setMobileOpenDropdown((prev) => (prev === label ? null : label));
  }, []);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;
      pushRecentSearch(q);
      navigate(`/news?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery("");
    },
    [searchQuery, navigate, pushRecentSearch]
  );

  const openMegaMenu = useCallback(() => {
    clearTimeout(megaCloseTimer.current);
    setMegaMenuOpen(true);
  }, []);
  const scheduleCloseMegaMenu = useCallback(() => {
    clearTimeout(megaCloseTimer.current);
    megaCloseTimer.current = setTimeout(() => setMegaMenuOpen(false), 150);
  }, []);

  /* ── Touch swipe to close ── */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) closeSidebar();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  /* ── Auth ── */
  const getUserInitials = () => {
    if (user?.fullname) {
      const parts = user.fullname.split(" ").filter(Boolean);
      return parts.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const logoutHandler = useCallback(async () => {
    try {
      const res = await api.post(
        "/user/logout",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data.success) {
        setUser(null);
        toast.success(res.data.message);
        localStorage.clear();
        navigate("/");
        closeSidebar();
      }
    } catch {
      toast.error("Logout failed");
    }
  }, [accessToken, setUser, navigate, closeSidebar]);

  const isCategoryActive = useCallback(
    (category) => {
      const params = new URLSearchParams(location.search);
      return params.get("category") === category;
    },
    [location.search]
  );
  const isLinkActive = useCallback(
    (link) => location.pathname === link,
    [location.pathname]
  );

  /* ─────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────── */
  return (
    <header
      className={`w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-md border-b border-gray-100" : ""
      }`}
    >
      <style>{`
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        {/* ── Top row ── */}
        <div
          className={`relative flex items-center justify-between transition-[padding] duration-300 ${
            isScrolled
              ? "py-2 sm:py-2.5"
              : "py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5"
          }`}
        >
          {/* Left cluster */}
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 text-gray-700">
            <button
              ref={menuButtonRef}
              onClick={toggleSidebar}
              className="hover:text-black rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-drawer"
            >
              <span className="inline-flex transition-transform duration-200">
                {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </span>
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="hover:text-black rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Toggle search"
              aria-expanded={searchOpen}
              title="Search (press /)"
            >
              <FiSearch size={18} className="sm:size-5" />
            </button>
          </div>

          {/* Logo */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded transition-opacity hover:opacity-80"
            aria-label="Feathered News home"
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
              <FiFeather
                className="text-black shrink-0"
                style={{
                  width: "clamp(18px, 3vw, 32px)",
                  height: "clamp(18px, 3vw, 32px)",
                }}
              />
              <h1
                className="font-black tracking-tight leading-none whitespace-nowrap"
                style={{ fontSize: "clamp(1rem, 2.6vw, 2rem)" }}
              >
                <span className="font-light text-gray-800">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
                <span className="font-extrabold text-black">NEWS</span>
              </h1>
            </div>
            <p
              className="tracking-[3px] sm:tracking-[6px] md:tracking-[8px] uppercase text-gray-400 font-light mt-1 sm:mt-2 hidden xs:block"
              style={{ fontSize: "clamp(8px, 1vw, 12px)" }}
            >
              Stories That Soar
            </p>
          </Link>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
            {/* Socials (lg+) */}
            <div className="hidden lg:flex items-center gap-2 text-gray-600">
              {[
                { href: "#", Icon: FaFacebookF, label: "Facebook" },
                {
                  href: "https://x.com/feathered_pen",
                  Icon: FaXTwitter,
                  label: "Twitter",
                },
                { href: "#", Icon: FaInstagram, label: "Instagram" },
                {
                  href: "https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo",
                  Icon: FaYoutube,
                  label: "YouTube",
                },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            {/* Auth */}
            {user ? (
              <Link
                to={profileRoute}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Your profile"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-105">
                  <AvatarImage src={getAvatarUrl(user?.avatar)} alt="" />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Log in"
              >
                <User size={20} className="sm:size-[22px]" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Desktop nav (lg+) ── */}
        <div className="hidden lg:block relative border-t border-gray-200">
          <div className="flex items-center justify-between py-2.5 gap-6">
            <nav aria-label="Primary" className="flex items-center gap-1">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.link}
                  aria-current={isLinkActive(item.link) ? "page" : undefined}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    isLinkActive(item.link)
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Categories mega menu */}
              <div
                className="relative"
                onMouseEnter={openMegaMenu}
                onMouseLeave={scheduleCloseMegaMenu}
              >
                <button
                  ref={megaTriggerRef}
                  type="button"
                  onClick={() => setMegaMenuOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={megaMenuOpen}
                  aria-controls="mega-menu"
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    megaMenuOpen
                      ? "bg-gray-100 text-black"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  Categories
                  <FiChevronDown
                    size={14}
                    className={`transition-transform ${
                      megaMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {megaMenuOpen && (
                  <div
                    ref={megaMenuRef}
                    id="mega-menu"
                    onMouseEnter={openMegaMenu}
                    onMouseLeave={scheduleCloseMegaMenu}
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-[440px] xl:w-[560px] bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 origin-top animate-[slideDown_180ms_ease-out]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 mb-3">
                      Browse by category
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categoriesLoading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <PillSkeleton key={i} />
                          ))
                        : categories.map((cat) => {
                            const c = beatColor(cat);
                            return (
                              <Link
                                key={cat}
                                to={`/news?category=${encodeURIComponent(cat)}`}
                                role="menuitem"
                                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-transform hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                style={{ color: c.fg, backgroundColor: c.bg }}
                              >
                                {cat}
                              </Link>
                            );
                          })}
                    </div>
                    <Link
                      to="/news"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600"
                    >
                      View all stories <FiChevronRight size={13} />
                    </Link>
                  </div>
                )}
              </div>

              {secondaryNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.link}
                  aria-current={isLinkActive(item.link) ? "page" : undefined}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    isLinkActive(item.link)
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Quick pills */}
            <div className="relative flex items-center gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/news"
                className={`snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  location.pathname === "/news" &&
                  !new URLSearchParams(location.search).get("category")
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
                }`}
              >
                All
              </Link>
              {categoriesLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <PillSkeleton key={i} w="w-14" />
                  ))
                : categories.slice(0, 6).map((cat) => {
                    const active = isCategoryActive(cat);
                    const c = beatColor(cat);
                    return (
                      <Link
                        key={cat}
                        to={`/news?category=${encodeURIComponent(cat)}`}
                        className="snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        style={
                          active
                            ? {
                                color: c.bg,
                                backgroundColor: c.fg,
                                borderColor: c.fg,
                              }
                            : {
                                color: c.fg,
                                borderColor: "transparent",
                                backgroundColor: c.bg,
                              }
                        }
                      >
                        {cat}
                      </Link>
                    );
                  })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
          searchOpen
            ? "max-h-[400px] opacity-100 border-t border-gray-200"
            : "max-h-0 opacity-0"
        }`}
      >
        <div ref={searchWrapRef} className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-3">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="relative"
            aria-label="Site search"
          >
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, or keywords..."
              className="w-full pl-10 pr-24 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg transition-colors focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none"
              aria-label="Search"
              autoComplete="off"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="p-1.5 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                >
                  <FiX size={16} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 border border-gray-200 rounded">
                /
              </kbd>
            </div>
          </form>

          {/* Recent searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 animate-[slideDown_180ms_ease-out]">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                <FiClock size={11} /> Recent:
              </span>
              {recentSearches.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSearchQuery(q);
                    searchInputRef.current?.focus();
                  }}
                  className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Popular */}
          {!searchQuery && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                <FiTrendingUp size={11} /> Popular:
              </span>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    navigate(`/news?category=${encodeURIComponent(cat)}`);
                    setSearchOpen(false);
                  }}
                  className="text-xs text-gray-600 hover:text-red-500 transition-colors underline decoration-gray-300 underline-offset-2"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── Sidebar drawer ── */}
      <div
        id="sidebar-drawer"
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-[340px] sm:w-[340px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <FiFeather className="text-xl text-black" />
              <span className="font-bold text-sm">Menu</span>
            </div>
            <button
              ref={closeButtonRef}
              onClick={closeSidebar}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Close menu"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* Profile */}
          {user && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <Link
                to={profileRoute}
                onClick={closeSidebar}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-12 w-12 transition-transform group-hover:scale-105">
                  <AvatarImage src={getAvatarUrl(user?.avatar)} alt="" />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.fullname || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || ""}
                  </p>
                  {userRole === "admin" && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <FiChevronRight
                  className="text-gray-400 group-hover:text-black transition-transform group-hover:translate-x-0.5"
                  size={18}
                />
              </Link>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overscroll-contain py-2">
            <ul className="space-y-0.5">
              {mobileNavItems.map((item) => {
                const subItems = item.sub || [];
                const hasSub = subItems.length > 0;
                const isActive = location.pathname === item.link;

                if (hasSub) {
                  const isOpen = mobileOpenDropdown === item.label;
                  return (
                    <li
                      key={item.label}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <button
                        onClick={() => toggleMobileDropdown(item.label)}
                        className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50"
                        aria-expanded={isOpen}
                        aria-controls={`submenu-${item.label}`}
                      >
                        <span className="flex-1 font-medium text-gray-700 text-sm">
                          {item.label}
                        </span>
                        <FiChevronDown
                          className={`transform transition-transform duration-300 text-gray-400 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          size={16}
                        />
                      </button>
                      <div
                        id={`submenu-${item.label}`}
                        className={`overflow-hidden transition-[max-height] duration-300 ${
                          isOpen ? "max-h-[600px]" : "max-h-0"
                        }`}
                      >
                        <ul className="bg-gray-50/80 py-1">
                          {categoriesLoading ? (
                            <li className="px-8 py-2.5 flex gap-2">
                              <PillSkeleton w="w-16" />
                              <PillSkeleton w="w-20" />
                            </li>
                          ) : (
                            subItems.map((sub) => (
                              <li key={sub.label}>
                                <Link
                                  to={sub.link}
                                  className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                                  onClick={closeSidebar}
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      to={item.link}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-sm ${
                        isActive ? "bg-gray-50 text-black font-semibold" : "text-gray-700 font-medium"
                      }`}
                      onClick={closeSidebar}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50/50">
            <div className="flex justify-center gap-2 py-3 px-4 border-b border-gray-200">
              {[
                { href: "#", Icon: FaFacebookF, label: "Facebook" },
                {
                  href: "https://x.com/feathered_pen",
                  Icon: FaXTwitter,
                  label: "Twitter",
                },
                { href: "#", Icon: FaInstagram, label: "Instagram" },
                {
                  href: "https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo",
                  Icon: FaYoutube,
                  label: "YouTube",
                },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
            <div className="p-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  {userRole === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                      onClick={closeSidebar}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={logoutHandler}
                    className="flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    onClick={closeSidebar}
                  >
                    <FiLogIn size={16} />
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    onClick={closeSidebar}
                  >
                    <FiUser size={16} />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
























// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import {
//   FiSearch,
//   FiMenu,
//   FiChevronDown,
//   FiX,
//   FiUser,
//   FiFeather,
//   FiLogIn,
//   FiChevronRight,
// } from "react-icons/fi";
// import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
// import { FaXTwitter } from "react-icons/fa6";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { getData } from "@/context/userContext";
// import axios from "axios";
// import { toast } from "sonner";
// import API from "@/utils/api";
// import { User } from "lucide-react";

// // ─── Editorial "beat" palette ─────────────────────────────
// const BEAT_PALETTE = [
//   { fg: "#B91C1C", bg: "#FEF2F2" },
//   { fg: "#1D4ED8", bg: "#EFF6FF" },
//   { fg: "#B45309", bg: "#FFFBEB" },
//   { fg: "#047857", bg: "#ECFDF5" },
//   { fg: "#6D28D9", bg: "#F5F3FF" },
//   { fg: "#0E7490", bg: "#ECFEFF" },
// ];
// const beatColor = (label = "") => {
//   let hash = 0;
//   for (let i = 0; i < label.length; i++) {
//     hash = (hash << 5) - hash + label.charCodeAt(i);
//     hash |= 0;
//   }
//   return BEAT_PALETTE[Math.abs(hash) % BEAT_PALETTE.length];
// };

// // ─── Helpers ──────────────────────────────────────────────
// const getAvatarUrl = (avatarPath) => {
//   if (!avatarPath) return null;
//   if (/^https?:\/\//.test(avatarPath)) return avatarPath;
//   const base = typeof API === "string" ? API.replace(/\/+$/, "") : "";
//   return base ? `${base}/${avatarPath.replace(/^\/+/, "")}` : null;
// };

// const getApiInstance = () => {
//   let instance;
//   if (API && typeof API.get === "function") {
//     instance = API;
//   } else {
//     instance = axios.create({
//       baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
//       headers: { "Content-Type": "application/json" },
//     });
//   }
//   instance.interceptors.request.use(
//     (config) => {
//       const token = localStorage.getItem("accessToken");
//       if (token) config.headers.Authorization = `Bearer ${token}`;
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
//   return instance;
// };

// const api = getApiInstance();

// const PillSkeleton = ({ w = "w-16" }) => (
//   <div className={`h-6 ${w} shrink-0 rounded-full bg-gray-100 animate-pulse`} />
// );

// const Navbar = () => {
//   const { user, setUser } = getData();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // ─── State ──────────────────────────────────────────────
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [categories, setCategories] = useState([]);
//   const [categoriesLoading, setCategoriesLoading] = useState(true);
//   const [megaMenuOpen, setMegaMenuOpen] = useState(false);

//   // ─── Refs ──────────────────────────────────────────────
//   const sidebarRef = useRef(null);
//   const menuButtonRef = useRef(null);
//   const closeButtonRef = useRef(null);
//   const searchInputRef = useRef(null);
//   const touchStartX = useRef(0);
//   const touchEndX = useRef(0);
//   const categoryFetched = useRef(false);
//   const megaMenuRef = useRef(null);
//   const megaTriggerRef = useRef(null);
//   const megaCloseTimer = useRef(null);

//   const accessToken = localStorage.getItem("accessToken");
//   const userRole = user?.role || "user";

//   // ─── Fetch categories (once) ──────────────────────────
//   useEffect(() => {
//     if (categoryFetched.current) return;
//     categoryFetched.current = true;

//     const fetchCategories = async () => {
//       try {
//         setCategoriesLoading(true);
//         const res = await api.get("/api/posts", { params: { limit: 100, page: 1 } });
//         const posts = res.data.data || [];
//         const unique = [...new Set(posts.map((p) => p.category).filter(Boolean))];
//         setCategories(unique);
//       } catch (error) {
//         console.error("Failed to fetch categories:", error);
//         setCategories(["Travel", "Food", "Lifestyle", "News", "Business", "Fashion"]);
//       } finally {
//         setCategoriesLoading(false);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // ─── Memoized nav items ──────────────────────────────
//   const primaryNavItems = useMemo(
//     () => [
//       { label: "Home", link: "/" },
//       { label: "News", link: "/news" },
//       { label: "Listen", link: "/audio" },
//     ],
//     []
//   );
//   const secondaryNavItems = useMemo(
//     () => [
//       { label: "Advertise", link: "/advertise" },
//       { label: "About", link: "/about" },
//       { label: "Contact", link: "/contact" },
//       { label: "Privacy", link: "/privacy" },
//     ],
//     []
//   );
//   const navItems = useMemo(() => {
//     const base = [
//       { label: "Home", link: "/" },
//       { label: "News", link: "/news" },
//       { label: "Listen", link: "/audio" },
//       {
//         label: "Categories",
//         sub: categories.map((cat) => ({
//           label: cat,
//           link: `/news?category=${encodeURIComponent(cat)}`,
//         })),
//       },
//       { label: "Advertise", link: "/advertise" },
//       { label: "Privacy", link: "/privacy" },
//       { label: "Contact", link: "/contact" },
//       { label: "About", link: "/about" },
//     ];
//     return base.filter((item) => item.sub?.length > 0 || item.link);
//   }, [categories]);

//   // ─── Close sidebar/menus on route change ──────────────
//   useEffect(() => {
//     setSidebarOpen(false);
//     setMobileOpenDropdown(null);
//     setMegaMenuOpen(false);
//   }, [location.pathname, location.search]);

//   // ─── Outside click for sidebar + mega menu ───────────
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         sidebarOpen &&
//         sidebarRef.current &&
//         !sidebarRef.current.contains(e.target) &&
//         !menuButtonRef.current?.contains(e.target)
//       ) {
//         setSidebarOpen(false);
//       }
//       if (
//         megaMenuOpen &&
//         megaMenuRef.current &&
//         !megaMenuRef.current.contains(e.target) &&
//         !megaTriggerRef.current?.contains(e.target)
//       ) {
//         setMegaMenuOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [sidebarOpen, megaMenuOpen]);

//   // ─── ESC to close everything ────────────────────────
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") {
//         setSidebarOpen(false);
//         setMobileOpenDropdown(null);
//         setSearchOpen(false);
//         setMegaMenuOpen(false);
//       }
//     };
//     document.addEventListener("keydown", handleEscape);
//     return () => document.removeEventListener("keydown", handleEscape);
//   }, []);

//   // ─── "/" keyboard shortcut opens search ──────────────
//   useEffect(() => {
//     const handleShortcut = (e) => {
//       const tag = document.activeElement?.tagName;
//       const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
//       if (e.key === "/" && !isTyping) {
//         e.preventDefault();
//         setSearchOpen(true);
//       }
//     };
//     document.addEventListener("keydown", handleShortcut);
//     return () => document.removeEventListener("keydown", handleShortcut);
//   }, []);

//   // ─── Focus trap for sidebar ──────────────────────────
//   useEffect(() => {
//     if (!sidebarOpen) return;
//     closeButtonRef.current?.focus();

//     const handleTab = (e) => {
//       if (e.key !== "Tab" || !sidebarRef.current) return;
//       const focusable = sidebarRef.current.querySelectorAll(
//         'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
//       );
//       if (focusable.length === 0) return;
//       const first = focusable[0];
//       const last = focusable[focusable.length - 1];

//       if (e.shiftKey && document.activeElement === first) {
//         e.preventDefault();
//         last.focus();
//       } else if (!e.shiftKey && document.activeElement === last) {
//         e.preventDefault();
//         first.focus();
//       }
//     };
//     document.addEventListener("keydown", handleTab);
//     return () => document.removeEventListener("keydown", handleTab);
//   }, [sidebarOpen]);

//   // ─── Auto‑focus search input ────────────────────────
//   useEffect(() => {
//     if (searchOpen && searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, [searchOpen]);

//   // ─── Scroll shadow + compact mode ───────────────────
//   useEffect(() => {
//     const handleScroll = () => setIsScrolled(window.scrollY > 10);
//     window.addEventListener("scroll", handleScroll, { passive: true });
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   // ─── Lock body scroll when sidebar open ──────────────
//   useEffect(() => {
//     if (sidebarOpen) {
//       document.body.style.overflow = "hidden";
//       document.body.style.position = "fixed";
//       document.body.style.width = "100%";
//     } else {
//       document.body.style.overflow = "";
//       document.body.style.position = "";
//       document.body.style.width = "";
//     }
//     return () => {
//       document.body.style.overflow = "";
//       document.body.style.position = "";
//       document.body.style.width = "";
//     };
//   }, [sidebarOpen]);

//   // ─── Handlers ──────────────────────────────────────────
//   const toggleSidebar = useCallback(() => {
//     setSidebarOpen((prev) => !prev);
//     setMobileOpenDropdown(null);
//   }, []);

//   const toggleMobileDropdown = useCallback((label) => {
//     setMobileOpenDropdown((prev) => (prev === label ? null : label));
//   }, []);

//   const closeSidebar = useCallback(() => {
//     setSidebarOpen(false);
//     setMobileOpenDropdown(null);
//   }, []);

//   const handleSearchSubmit = useCallback(
//     (e) => {
//       e.preventDefault();
//       const query = searchQuery.trim();
//       if (query) {
//         navigate(`/news?search=${encodeURIComponent(query)}`);
//         setSearchOpen(false);
//         setSearchQuery("");
//       }
//     },
//     [searchQuery, navigate]
//   );

//   // ─── Mega menu open/close with small delay ──────────
//   const openMegaMenu = useCallback(() => {
//     clearTimeout(megaCloseTimer.current);
//     setMegaMenuOpen(true);
//   }, []);
//   const scheduleCloseMegaMenu = useCallback(() => {
//     clearTimeout(megaCloseTimer.current);
//     megaCloseTimer.current = setTimeout(() => setMegaMenuOpen(false), 150);
//   }, []);

//   // ─── Touch swipe to close sidebar ────────────────────
//   const handleTouchStart = (e) => {
//     touchStartX.current = e.touches[0].clientX;
//     touchEndX.current = e.touches[0].clientX;
//   };
//   const handleTouchMove = (e) => {
//     touchEndX.current = e.touches[0].clientX;
//   };
//   const handleTouchEnd = () => {
//     if (touchStartX.current - touchEndX.current > 75) {
//       closeSidebar();
//     }
//     touchStartX.current = 0;
//     touchEndX.current = 0;
//   };

//   // ─── Auth helpers ──────────────────────────────────
//   const getUserInitials = () => {
//     if (user?.fullname) {
//       const parts = user.fullname.split(" ");
//       return parts.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
//     }
//     if (user?.email) return user.email[0].toUpperCase();
//     return "U";
//   };

//   const getRoleBadge = () => (userRole === "admin" ? "A" : null);
//   const profileRoute = userRole === "admin" ? "/admin/profile" : "/profile";

//   const logoutHandler = useCallback(async () => {
//     try {
//       const res = await api.post("/user/logout", {}, { headers: { Authorization: `Bearer ${accessToken}` } });
//       if (res.data.success) {
//         setUser(null);
//         toast.success(res.data.message);
//         localStorage.clear();
//         navigate("/");
//         closeSidebar();
//       }
//     } catch {
//       toast.error("Logout failed");
//     }
//   }, [accessToken, setUser, navigate, closeSidebar]);

//   const isCategoryActive = (category) => {
//     const params = new URLSearchParams(location.search);
//     return params.get("category") === category;
//   };
//   const isLinkActive = (link) => location.pathname === link;

//   // ─── Render ──────────────────────────────────────────
//   return (
//     <header
//       className={`w-full bg-white sticky top-0 z-50 transition-shadow duration-300 ease-in-out ${
//         isScrolled ? "shadow-sm" : ""
//       }`}
//     >
//       <style>{`
//         @keyframes fadeInRight {
//           from { opacity: 0; transform: translateX(8px); }
//           to { opacity: 1; transform: translateX(0); }
//         }
//         @media (prefers-reduced-motion: reduce) {
//           *, *::before, *::after {
//             animation-duration: 0.001ms !important;
//             transition-duration: 0.001ms !important;
//           }
//         }
//       `}</style>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* ─── Top Header ──────────────────────────────────── */}
//         <div
//           className={`relative flex items-center justify-between transition-[padding] duration-300 ease-in-out ${
//             isScrolled ? "py-2.5 sm:py-3" : "py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5"
//           }`}
//         >
//           {/* Left: Hamburger + Search */}
//           <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
//             <button
//               ref={menuButtonRef}
//               onClick={toggleSidebar}
//               className="hover:text-black rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               aria-label={sidebarOpen ? "Close menu" : "Open menu"}
//               aria-expanded={sidebarOpen}
//               aria-controls="sidebar-drawer"
//             >
//               <span className="inline-flex transition-transform duration-200 ease-in-out">
//                 {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
//               </span>
//             </button>
//             <button
//               onClick={() => setSearchOpen((v) => !v)}
//               className="hover:text-black rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               aria-label="Toggle search"
//               aria-expanded={searchOpen}
//               title="Search (press /)"
//             >
//               <FiSearch size={18} className="sm:size-5 mb-1" />
//             </button>
//           </div>

//           {/* ─── Logo ────────────────────────────────── */}
//           <Link
//             to="/"
//             className="absolute left-1/2 -translate-x-1/2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded transition-opacity duration-200 ease-in-out hover:opacity-80"
//           >
//             <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
//               <FiFeather
//                 className="text-black shrink-0"
//                 style={{ width: "clamp(20px, 3vw, 32px)", height: "clamp(20px, 3vw, 32px)" }}
//               />
//               <h1
//                 className="font-black tracking-tight leading-none"
//                 style={{ fontSize: "clamp(1.25rem, 2.6vw, 2rem)" }}
//               >
//                 <span className="font-light text-gray-800">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
//                 <span className="font-extrabold text-black">NEWS</span>
//               </h1>
//             </div>
//             <p className="tracking-[4px] sm:tracking-[6px] md:tracking-[8px] uppercase text-[10px] sm:text-[11px] md:text-[12px] mt-1 sm:mt-2 text-gray-400 font-light">
//               Stories That Soar
//             </p>
//           </Link>

//           {/* Right: Social + Auth */}
//           <div className="flex items-center gap-4 lg:gap-5">
//             <div className="hidden lg:flex items-center gap-2.5 text-gray-600">
//               <a
//                 href="#"
//                 aria-label="Facebook"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaFacebookF size={16} />
//               </a>
//               <a
//                 href="https://x.com/feathered_pen"
//                 aria-label="Twitter"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaXTwitter size={16} />
//               </a>
//               <a
//                 href="#"
//                 aria-label="Instagram"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaInstagram size={16} />
//               </a>
//               <a
//                 href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
//                 aria-label="YouTube"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaYoutube size={16} />
//               </a>
//             </div>

//             {/* Auth */}
//             {user ? (
//               <div className="flex items-center gap-3">
//                 <Link
//                   to={profileRoute}
//                   className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 group transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                 >
//                   <div className="relative">
//                     <Avatar className="h-8 w-8 transition-transform duration-200 ease-in-out group-hover:scale-105">
//                       <AvatarImage src={getAvatarUrl(user?.avatar)} />
//                       <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
//                         {getUserInitials()}
//                         {getRoleBadge() && (
//                           <span className="ml-0.5 text-[8px]">{getRoleBadge()}</span>
//                         )}
//                       </AvatarFallback>
//                     </Avatar>
//                   </div>
//                 </Link>
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Link
//                   to="/login"
//                   className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-gray-600 hover:text-black transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                   aria-label="Log in"
//                 >
//                   <User size={20} className="sm:size-[22px]" />
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ─── DESKTOP PRIMARY NAV + CATEGORIES MEGA MENU ──── */}
//         <div className="hidden lg:block relative border-t border-gray-200">
//           <div className="flex items-center justify-between py-2.5 gap-6">
//             <nav aria-label="Primary" className="flex items-center gap-1">
//               {primaryNavItems.map((item) => (
//                 <Link
//                   key={item.label}
//                   to={item.link}
//                   aria-current={isLinkActive(item.link) ? "page" : undefined}
//                   className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
//                     isLinkActive(item.link)
//                       ? "bg-black text-white"
//                       : "text-gray-600 hover:bg-gray-100 hover:text-black"
//                   }`}
//                 >
//                   {item.label}
//                 </Link>
//               ))}

//               {/* Categories mega menu trigger */}
//               <div
//                 className="relative"
//                 onMouseEnter={openMegaMenu}
//                 onMouseLeave={scheduleCloseMegaMenu}
//               >
//                 <button
//                   ref={megaTriggerRef}
//                   type="button"
//                   onClick={() => setMegaMenuOpen((v) => !v)}
//                   aria-haspopup="true"
//                   aria-expanded={megaMenuOpen}
//                   className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
//                     megaMenuOpen ? "bg-gray-100 text-black" : "text-gray-600 hover:bg-gray-100 hover:text-black"
//                   }`}
//                 >
//                   Categories
//                   <FiChevronDown
//                     size={14}
//                     className={`transition-transform duration-200 ${megaMenuOpen ? "rotate-180" : ""}`}
//                   />
//                 </button>

//                 <div
//                   ref={megaMenuRef}
//                   onMouseEnter={openMegaMenu}
//                   onMouseLeave={scheduleCloseMegaMenu}
//                   className={`absolute left-0 top-full mt-2 w-[420px] xl:w-[520px] bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 origin-top transition-all duration-200 ease-out ${
//                     megaMenuOpen
//                       ? "opacity-100 scale-100 pointer-events-auto"
//                       : "opacity-0 scale-95 pointer-events-none"
//                   }`}
//                   role="menu"
//                 >
//                   <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 mb-3">
//                     Browse by category
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {categoriesLoading
//                       ? Array.from({ length: 8 }).map((_, i) => <PillSkeleton key={i} />)
//                       : categories.map((cat) => {
//                           const c = beatColor(cat);
//                           return (
//                             <Link
//                               key={cat}
//                               to={`/news?category=${encodeURIComponent(cat)}`}
//                               role="menuitem"
//                               className="text-xs font-semibold px-3 py-1.5 rounded-full transition-transform duration-150 hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                               style={{ color: c.fg, backgroundColor: c.bg }}
//                             >
//                               {cat}
//                             </Link>
//                           );
//                         })}
//                   </div>
//                   <Link
//                     to="/news"
//                     className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600"
//                   >
//                     View all stories <FiChevronRight size={13} />
//                   </Link>
//                 </div>
//               </div>

//               {secondaryNavItems.map((item) => (
//                 <Link
//                   key={item.label}
//                   to={item.link}
//                   aria-current={isLinkActive(item.link) ? "page" : undefined}
//                   className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
//                     isLinkActive(item.link)
//                       ? "bg-black text-white"
//                       : "text-gray-600 hover:bg-gray-100 hover:text-black"
//                   }`}
//                 >
//                   {item.label}
//                 </Link>
//               ))}
//             </nav>

//             {/* Quick category pills on desktop */}
//             <div className="flex items-center gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory min-w-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//               <Link
//                 to="/news"
//                 className={`snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
//                   location.pathname === "/news" && !new URLSearchParams(location.search).get("category")
//                     ? "bg-black text-white border-black"
//                     : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
//                 }`}
//               >
//                 All
//               </Link>
//               {categoriesLoading
//                 ? Array.from({ length: 4 }).map((_, i) => <PillSkeleton key={i} w="w-14" />)
//                 : categories.slice(0, 6).map((cat) => {
//                     const active = isCategoryActive(cat);
//                     const c = beatColor(cat);
//                     return (
//                       <Link
//                         key={cat}
//                         to={`/news?category=${encodeURIComponent(cat)}`}
//                         className="snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                         style={
//                           active
//                             ? { color: c.bg, backgroundColor: c.fg, borderColor: c.fg }
//                             : { color: c.fg, borderColor: "transparent", backgroundColor: c.bg }
//                         }
//                       >
//                         {cat}
//                       </Link>
//                     );
//                   })}
//             </div>
//           </div>
//           <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
//         </div>
//       </div>

//       {/* ─── Search Bar ────────────────────────────────────── */}
//       <div
//         className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
//           searchOpen ? "max-h-32 opacity-100 border-t border-gray-200" : "max-h-0 opacity-0"
//         }`}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
//           <form onSubmit={handleSearchSubmit} className="relative">
//             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//             <input
//               ref={searchInputRef}
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search articles, topics, or keywords..."
//               className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md transition-colors duration-200 ease-in-out focus:border-black focus:outline-none"
//               aria-label="Search"
//             />
//             {searchQuery && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setSearchQuery("");
//                   searchInputRef.current?.focus();
//                 }}
//                 aria-label="Clear search"
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
//               >
//                 <FiX size={16} />
//               </button>
//             )}
//           </form>
//           {!searchQuery && categories.length > 0 && (
//             <div className="flex flex-wrap items-center gap-2 mt-2.5">
//               <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
//                 Popular:
//               </span>
//               {categories.slice(0, 5).map((cat) => (
//                 <button
//                   key={cat}
//                   type="button"
//                   onClick={() => {
//                     navigate(`/news?category=${encodeURIComponent(cat)}`);
//                     setSearchOpen(false);
//                   }}
//                   className="text-xs text-gray-600 hover:text-red-500 transition-colors underline decoration-gray-300 underline-offset-2"
//                 >
//                   {cat}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ─── Sidebar (Drawer) ──────────────────────────────── */}
//       <div
//         className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
//           sidebarOpen ? "opacity-100 block" : "opacity-0 hidden"
//         }`}
//         onClick={closeSidebar}
//         aria-hidden="true"
//       />

//       <div
//         id="sidebar-drawer"
//         ref={sidebarRef}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//         onTouchEnd={handleTouchEnd}
//         className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] max-w-[85vw] bg-white z-50 transition-transform duration-300 ease-in-out will-change-transform ${
//           sidebarOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//         role="dialog"
//         aria-modal="true"
//         aria-label="Navigation menu"
//         aria-hidden={!sidebarOpen}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
//             <div className="flex items-center gap-2">
//               <FiFeather className="text-xl text-black" />
//               <span className="font-bold text-sm">Menu</span>
//             </div>
//             <button
//               ref={closeButtonRef}
//               onClick={closeSidebar}
//               className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               aria-label="Close menu"
//             >
//               <FiX size={24} />
//             </button>
//           </div>

//           {/* User Profile */}
//           {user && (
//             <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
//               <Link
//                 to={profileRoute}
//                 onClick={closeSidebar}
//                 className="flex items-center gap-3 group"
//               >
//                 <Avatar className="h-12 w-12 transition-transform duration-200 ease-in-out group-hover:scale-105">
//                   <AvatarImage src={getAvatarUrl(user?.avatar)} />
//                   <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-bold">
//                     {getUserInitials()}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {user?.fullname || "User"}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
//                   {userRole === "admin" && (
//                     <span className="inline-block mt-0.5 text-[9px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
//                       Admin
//                     </span>
//                   )}
//                 </div>
//                 <FiChevronRight className="text-gray-400 group-hover:text-black transition-all duration-200 ease-in-out group-hover:translate-x-0.5" size={18} />
//               </Link>
//             </div>
//           )}

//           {/* Navigation Links */}
//           <nav className="flex-1 overflow-y-auto py-2">
//             <ul className="space-y-0.5">
//               {navItems.map((item) => {
//                 const subItems = item.sub || [];
//                 const hasSub = subItems.length > 0;
//                 const isActive = location.pathname === item.link;

//                 if (hasSub) {
//                   const isOpen = mobileOpenDropdown === item.label;
//                   return (
//                     <li key={item.label} className="border-b border-gray-100 last:border-0">
//                       <button
//                         onClick={() => toggleMobileDropdown(item.label)}
//                         className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ease-in-out ${
//                           isActive ? "bg-gray-50" : ""
//                         }`}
//                         aria-expanded={isOpen}
//                       >
//                         <span className="flex-1 font-medium text-gray-700">{item.label}</span>
//                         <FiChevronDown
//                           className={`transform transition-transform duration-300 ease-in-out ${
//                             isOpen ? "rotate-180" : ""
//                           } text-gray-400`}
//                           size={16}
//                         />
//                       </button>
//                       <div
//                         className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
//                           isOpen ? "max-h-[500px]" : "max-h-0"
//                         }`}
//                       >
//                         <ul className="bg-gray-50/80 py-1">
//                           {categoriesLoading ? (
//                             <li className="px-8 py-2.5 flex gap-2">
//                               <PillSkeleton w="w-16" />
//                               <PillSkeleton w="w-20" />
//                             </li>
//                           ) : (
//                             subItems.map((sub) => (
//                               <li key={sub.label}>
//                                 <Link
//                                   to={sub.link}
//                                   className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition-colors duration-200 ease-in-out"
//                                   onClick={closeSidebar}
//                                 >
//                                   {sub.label}
//                                 </Link>
//                               </li>
//                             ))
//                           )}
//                         </ul>
//                       </div>
//                     </li>
//                   );
//                 }

//                 return (
//                   <li key={item.label}>
//                     <Link
//                       to={item.link}
//                       aria-current={isActive ? "page" : undefined}
//                       className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200 ease-in-out ${
//                         isActive ? "bg-gray-50 text-black" : "text-gray-700"
//                       }`}
//                       onClick={closeSidebar}
//                     >
//                       <span className="font-medium">{item.label}</span>
//                       {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />}
//                     </Link>
//                   </li>
//                 );
//               })}
//             </ul>
//           </nav>

//           {/* Footer */}
//           <div className="border-t border-gray-200 bg-gray-50/50">
//             <div className="flex justify-center gap-2.5 py-4 px-4 border-b border-gray-200">
//               <a
//                 href="#"
//                 aria-label="Facebook"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaFacebookF size={16} />
//               </a>
//               <a
//                 href="https://x.com/feathered_pen"
//                 aria-label="Twitter"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaXTwitter size={16} />
//               </a>
//               <a
//                 href="#"
//                 aria-label="Instagram"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaInstagram size={16} />
//               </a>
//               <a
//                 href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
//                 aria-label="YouTube"
//                 className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//               >
//                 <FaYoutube size={16} />
//               </a>
//             </div>
//             <div className="p-4">
//               {user ? (
//                 <div className="flex flex-col gap-2">
//                   {userRole === "admin" && (
//                     <Link
//                       to="/admin/dashboard"
//                       className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 ease-in-out"
//                       onClick={closeSidebar}
//                     >
//                       Admin Panel
//                     </Link>
//                   )}
//                   <button
//                     onClick={logoutHandler}
//                     className="flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200 ease-in-out"
//                   >
//                     Sign Out
//                   </button>
//                 </div>
//               ) : (
//                 <div className="flex gap-2">
//                   <Link
//                     to="/login"
//                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200 ease-in-out"
//                     onClick={closeSidebar}
//                   >
//                     <FiLogIn size={16} />
//                     Log In
//                   </Link>
//                   <Link
//                     to="/signup"
//                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 ease-in-out"
//                     onClick={closeSidebar}
//                   >
//                     <FiUser size={16} />
//                     Sign Up
//                   </Link>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Navbar;




