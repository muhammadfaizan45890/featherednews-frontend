import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
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
  FiClock,
  FiLogOut,
  FiGrid,
} from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getData } from "@/context/userContext";
import axios from "axios";
import { toast } from "sonner";
import API from "@/utils/api";

/* ════════════════════════════════════════════════════════════
   Config
   ════════════════════════════════════════════════════════════ */

// Replace the "#" links with your real Facebook / Instagram URLs.
const SOCIALS = [
  { label: "Facebook", href: "#", Icon: FaFacebookF },
  { label: "X (Twitter)", href: "https://x.com/feathered_pen", Icon: FaXTwitter },
  { label: "Instagram", href: "#", Icon: FaInstagram },
  {
    label: "YouTube",
    href: "https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo",
    Icon: FaYoutube,
  },
];

const NAV_ITEMS = [
  { label: "Home", link: "/" },
  { label: "News", link: "/news" },
  { label: "Listen", link: "/audio" },
  { label: "Advertise", link: "/advertise" },
  { label: "About", link: "/about" },
  { label: "Contact", link: "/contact" },
  { label: "Privacy", link: "/privacy" },
];

const FALLBACK_CATEGORIES = ["Travel", "Food", "Lifestyle", "News", "Business", "Fashion"];
const RECENT_KEY = "fn_recent_searches";
const CATEGORY_CACHE_KEY = "fn_categories_v1";
const CATEGORY_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/* ════════════════════════════════════════════════════════════
   Editorial "beat" palette — one stable colour per category
   ════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const safeStorage = {
  get(key, storage = "local") {
    try {
      return (storage === "session" ? sessionStorage : localStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value, storage = "local") {
    try {
      (storage === "session" ? sessionStorage : localStorage).setItem(key, value);
    } catch {
      /* storage unavailable (private mode / quota) */
    }
  },
  remove(key, storage = "local") {
    try {
      (storage === "session" ? sessionStorage : localStorage).removeItem(key);
    } catch {
      /* noop */
    }
  },
};

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (/^https?:\/\//.test(avatarPath)) return avatarPath;
  const base = typeof API === "string" ? API.replace(/\/+$/, "") : "";
  return base ? `${base}/${avatarPath.replace(/^\/+/, "")}` : null;
};

const getApiInstance = () => {
  const instance =
    API && typeof API.get === "function"
      ? API
      : axios.create({
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
          headers: { "Content-Type": "application/json" },
        });

  // Attach the auth interceptor only once per instance
  if (!instance.__navbarAuthAttached) {
    instance.interceptors.request.use(
      (config) => {
        const token = safeStorage.get("accessToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    instance.__navbarAuthAttached = true;
  }
  return instance;
};

const api = getApiInstance();

const readRecentSearches = () => {
  try {
    const parsed = JSON.parse(safeStorage.get(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1";

/* ════════════════════════════════════════════════════════════
   Small components
   ════════════════════════════════════════════════════════════ */
const PillSkeleton = ({ w = "w-16" }) => (
  <div className={`h-7 ${w} shrink-0 rounded-full bg-gray-100 animate-pulse`} />
);

const SocialLinks = ({ className = "", size = 16, itemClass = "" }) => (
  <div className={`flex items-center gap-2.5 text-gray-600 ${className}`}>
    {SOCIALS.map(({ label, href, Icon }) => (
      <a
        key={label}
        href={href}
        aria-label={label}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className={`flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black transition-colors duration-200 ${focusRing} ${itemClass}`}
      >
        <Icon size={size} />
      </a>
    ))}
  </div>
);

const UserAvatar = ({ user, initials, className = "h-8 w-8", textClass = "text-xs" }) => (
  <Avatar className={className}>
    <AvatarImage src={getAvatarUrl(user?.avatar)} alt={user?.fullname || "Profile"} />
    <AvatarFallback className={`bg-gray-200 text-gray-700 font-bold ${textClass}`}>
      {initials}
    </AvatarFallback>
  </Avatar>
);

/* ════════════════════════════════════════════════════════════
   Navbar
   ════════════════════════════════════════════════════════════ */
const Navbar = () => {
  const { user, setUser } = getData();
  const navigate = useNavigate();
  const location = useLocation();

  /* ─── State ───────────────────────────────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // hides nav rows while scrolling down
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  /* ─── Refs ────────────────────────────────────────────── */
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const userMenuRef = useRef(null);
  const progressRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const userRole = user?.role || "user";
  const isAdmin = userRole === "admin";
  const profileRoute = isAdmin ? "/admin/profile" : "/profile";

  const activeCategory = useMemo(
    () => new URLSearchParams(location.search).get("category"),
    [location.search]
  );

  /* ─── Categories (cached + abortable) ─────────────────── */
  useEffect(() => {
    const controller = new AbortController();

    // 1) try the session cache first
    try {
      const cached = JSON.parse(safeStorage.get(CATEGORY_CACHE_KEY, "session") || "null");
      if (cached && Date.now() - cached.t < CATEGORY_CACHE_TTL && cached.items?.length) {
        setCategories(cached.items);
        setCategoriesLoading(false);
        return () => controller.abort();
      }
    } catch {
      /* ignore bad cache */
    }

    // 2) otherwise fetch
    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await api.get("/api/posts", {
          params: { limit: 100, page: 1 },
          signal: controller.signal,
        });
        const posts = res.data?.data || [];
        const unique = [...new Set(posts.map((p) => p.category).filter(Boolean))];
        const items = unique.length ? unique : FALLBACK_CATEGORIES;
        setCategories(items);
        safeStorage.set(
          CATEGORY_CACHE_KEY,
          JSON.stringify({ t: Date.now(), items }),
          "session"
        );
      } catch (error) {
        if (axios.isCancel?.(error) || error?.code === "ERR_CANCELED") return;
        console.error("Failed to fetch categories:", error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  /* ─── Recent searches ─────────────────────────────────── */
  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  const saveRecentSearch = useCallback((q) => {
    const next = [q, ...readRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    safeStorage.set(RECENT_KEY, JSON.stringify(next));
    setRecentSearches(next);
  }, []);

  const clearRecentSearches = useCallback(() => {
    safeStorage.remove(RECENT_KEY);
    setRecentSearches([]);
  }, []);

  /* ─── Mobile nav model ────────────────────────────────── */
  const mobileNavItems = useMemo(
    () => [
      { label: "Home", link: "/" },
      { label: "News", link: "/news" },
      { label: "Listen", link: "/audio" },
      { label: "Advertise", link: "/advertise" },
      { label: "Privacy", link: "/privacy" },
      { label: "Contact", link: "/contact" },
      { label: "About", link: "/about" },
    ],
    []
  );

  /* ─── Close overlays on route change ──────────────────── */
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  /* ─── Outside click: sidebar + user menu ──────────────── */
  useEffect(() => {
    const onPointerDown = (e) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !menuButtonRef.current?.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [sidebarOpen, userMenuOpen]);

  /* ─── Keyboard: Esc closes, "/" and Ctrl/Cmd+K open search ─ */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setSearchOpen(false);
        setUserMenuOpen(false);
        return;
      }
      const el = document.activeElement;
      const isTyping =
        el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "/" && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ─── Focus management: sidebar ───────────────────────── */
  const sidebarWasOpen = useRef(false);
  useEffect(() => {
    if (sidebarOpen) {
      sidebarWasOpen.current = true;
      // wait a frame so the drawer is visible before focusing
      const id = requestAnimationFrame(() => closeButtonRef.current?.focus());

      const handleTab = (e) => {
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
      document.addEventListener("keydown", handleTab);
      return () => {
        cancelAnimationFrame(id);
        document.removeEventListener("keydown", handleTab);
      };
    }
    if (sidebarWasOpen.current) {
      sidebarWasOpen.current = false;
      menuButtonRef.current?.focus({ preventScroll: true });
    }
  }, [sidebarOpen]);

  /* ─── Focus management: search ────────────────────────── */
  const searchWasOpen = useRef(false);
  useEffect(() => {
    if (searchOpen) {
      searchWasOpen.current = true;
      const id = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    if (searchWasOpen.current) {
      searchWasOpen.current = false;
      searchButtonRef.current?.focus({ preventScroll: true });
    }
  }, [searchOpen]);

  /* ─── Scroll: shadow, collapse-on-scroll-down, progress ── */
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      setIsScrolled(y > 10);

      if (y < 120) setCollapsed(false);
      else if (delta > 6) setCollapsed(true);
      else if (delta < -6) setCollapsed(false);

      if (Math.abs(delta) > 6) lastY = y;

      if (progressRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        progressRef.current.style.transform = `scaleX(${p})`;
        progressRef.current.style.opacity = y > 40 ? "1" : "0";
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  /* ─── Lock body scroll (no layout jump) ───────────────── */
  useEffect(() => {
    if (!(sidebarOpen || searchOpen)) return;
    const body = document.body;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [sidebarOpen, searchOpen]);

  /* ─── Handlers ────────────────────────────────────────── */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
    setUserMenuOpen(false);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const runSearch = useCallback(
    (raw) => {
      const query = raw.trim();
      if (!query) return;
      saveRecentSearch(query);
      navigate(`/news?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setSearchQuery("");
    },
    [navigate, saveRecentSearch]
  );

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      runSearch(searchQuery);
    },
    [runSearch, searchQuery]
  );

  const goToCategory = useCallback(
    (cat) => {
      navigate(`/news?category=${encodeURIComponent(cat)}`);
      setSearchOpen(false);
    },
    [navigate]
  );

  // Swipe left to close the (left-side) drawer
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

  /* ─── Auth helpers ────────────────────────────────────── */
  const initials = useMemo(() => {
    if (user?.fullname) {
      return user.fullname
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  }, [user]);

  const logoutHandler = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = safeStorage.get("accessToken");
      const res = await api.post(
        "/user/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setUser(null);
        toast.success(res.data.message);
        // remove only auth keys instead of wiping everything
        ["accessToken", "refreshToken", "user"].forEach((k) => safeStorage.remove(k));
        setUserMenuOpen(false);
        closeSidebar();
        navigate("/");
      } else {
        toast.error("Logout failed");
      }
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, setUser, navigate, closeSidebar]);

  const isLinkActive = (link) =>
    link === "/" ? location.pathname === "/" : location.pathname.startsWith(link);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const navHidden = collapsed && !searchOpen && !sidebarOpen && !userMenuOpen;

  /* ═════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .fn-scroll-x { scrollbar-width: none; -ms-overflow-style: none; }
        .fn-scroll-x::-webkit-scrollbar { display: none; }
        @keyframes fn-pop {
          from { opacity: 0; transform: translateY(-6px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fn-pop { animation: fn-pop .16s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .fn-pop { animation: none; }
          .fn-motion, .fn-motion * { transition-duration: .001ms !important; }
        }
      `}</style>

      <header
        className={`fn-motion w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 sticky top-0 z-50 transition-shadow duration-300 ${
          isScrolled ? "shadow-sm" : ""
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Reading progress */}
        <div
          ref={progressRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-red-600 opacity-0 transition-opacity duration-200"
          style={{ transform: "scaleX(0)", willChange: "transform" }}
        />

        <div className="mx-auto w-full max-w-[1600px] px-3 min-[380px]:px-4 sm:px-6 lg:px-8 2xl:px-12">
          {/* ─── Top bar (3-column grid keeps the logo truly centred) ── */}
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 transition-[padding] duration-300 ${
              isScrolled ? "py-2 sm:py-2.5" : "py-3 sm:py-4 xl:py-5"
            }`}
          >
            {/* Left: menu + search + date */}
            <div className="flex items-center gap-1 sm:gap-2 text-gray-700 min-w-0">
              <button
                ref={menuButtonRef}
                onClick={toggleSidebar}
                className={`rounded-full p-2 hover:bg-gray-100 hover:text-black transition-colors duration-200 ${focusRing}`}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar-drawer"
              >
                {sidebarOpen ? <FiX className="h-5 w-5 sm:h-[22px] sm:w-[22px]" /> : <FiMenu className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />}
              </button>
              <button
                ref={searchButtonRef}
                onClick={() => setSearchOpen(true)}
                className={`rounded-full p-2 hover:bg-gray-100 hover:text-black transition-colors duration-200 ${focusRing}`}
                aria-label="Open search"
                aria-haspopup="dialog"
                title="Search (press / or Ctrl+K)"
              >
                <FiSearch className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </button>
              <time
                dateTime={new Date().toISOString().slice(0, 10)}
                className="hidden 2xl:block ml-3 text-xs text-gray-500 truncate"
              >
                {todayLabel}
              </time>
            </div>

            {/* Centre: logo */}
            <Link
              to="/"
              aria-label="FeatheredNews home"
              className={`text-center rounded transition-opacity duration-200 hover:opacity-80 ${focusRing}`}
            >
              <div className="flex items-center justify-center gap-1.5 md:gap-3">
                <FiFeather
                  className="hidden min-[380px]:block text-black shrink-0"
                  style={{ width: "clamp(18px, 3vw, 34px)", height: "clamp(18px, 3vw, 34px)" }}
                />
                <h1
                  className="font-black tracking-tight leading-none whitespace-nowrap"
                  style={{ fontSize: "clamp(1rem, 4.4vw, 2.1rem)" }}
                >
                  <span className="font-light text-gray-800">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
                  <span className="font-extrabold text-black">NEWS</span>
                </h1>
              </div>
              <p
                className={`overflow-hidden whitespace-nowrap tracking-[0.35em] sm:tracking-[0.5em] text-[9px] sm:text-[11px] text-gray-400 font-light transition-all duration-300 ${
                  isScrolled ? "max-h-0 opacity-0 mt-0" : "max-h-5 opacity-100 mt-1 sm:mt-2"
                }`}
              >
                STORIES THAT SOAR
              </p>
            </Link>

            {/* Right: socials + auth */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 xl:gap-5 min-w-0">
              <SocialLinks className="hidden xl:flex" />

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-full pl-1 pr-1.5 py-1 hover:bg-gray-100 transition-colors duration-200 ${focusRing}`}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-label="Account menu"
                  >
                    <UserAvatar user={user} initials={initials} />
                    <FiChevronDown
                      size={14}
                      className={`hidden sm:block text-gray-400 transition-transform duration-200 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="fn-pop absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                    >
                      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 p-3">
                        <UserAvatar user={user} initials={initials} className="h-10 w-10" textClass="text-sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user?.fullname || "User"}
                          </p>
                          <p className="truncate text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <Link
                          role="menuitem"
                          to={profileRoute}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 ${focusRing}`}
                        >
                          <FiUser size={16} /> Profile
                        </Link>
                        {isAdmin && (
                          <Link
                            role="menuitem"
                            to="/admin/dashboard"
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 ${focusRing}`}
                          >
                            <FiGrid size={16} /> Admin panel
                          </Link>
                        )}
                        <button
                          role="menuitem"
                          onClick={logoutHandler}
                          disabled={loggingOut}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 ${focusRing}`}
                        >
                          <FiLogOut size={16} /> {loggingOut ? "Signing out…" : "Sign out"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`flex items-center gap-2 rounded-full p-2 sm:px-4 sm:py-2 text-gray-700 hover:bg-gray-100 sm:bg-black sm:text-white sm:hover:bg-gray-800 transition-colors duration-200 ${focusRing}`}
                  aria-label="Log in"
                >
                  <FiUser className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Log in</span>
                </Link>
              )}
            </div>
          </div>

          {/* ─── Collapsible rows: primary nav + category strip ─── */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              navHidden ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
            aria-hidden={navHidden}
          >
            <div className="min-h-0 overflow-hidden">
              {/* Desktop primary nav */}
              <nav aria-label="Primary" className="hidden lg:block border-t border-gray-200">
                <ul className="flex flex-wrap items-center justify-center gap-1 py-2.5">
                  {NAV_ITEMS.map((item) => {
                    const active = isLinkActive(item.link);
                    return (
                      <li key={item.label}>
                        <Link
                          to={item.link}
                          tabIndex={navHidden ? -1 : 0}
                          aria-current={active ? "page" : undefined}
                          className={`px-3.5 py-1.5 text-[13px] font-semibold tracking-wide rounded-full transition-colors duration-200 ${focusRing} ${
                            active
                              ? "bg-black text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-black"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Category strip — scrolls horizontally on every screen */}
              <div className="relative border-t border-gray-100">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent"
                />
                <nav
                  aria-label="Categories"
                  className="fn-scroll-x flex items-center gap-2 overflow-x-auto py-2 px-1 lg:justify-center"
                >
                  {categoriesLoading ? (
                    <>
                      <PillSkeleton w="w-16" />
                      <PillSkeleton w="w-20" />
                      <PillSkeleton w="w-14" />
                      <PillSkeleton w="w-24" />
                      <PillSkeleton w="w-16" />
                    </>
                  ) : (
                    categories.map((cat) => {
                      const { fg, bg } = beatColor(cat);
                      const active = activeCategory === cat;
                      return (
                        <Link
                          key={cat}
                          to={`/news?category=${encodeURIComponent(cat)}`}
                          tabIndex={navHidden ? -1 : 0}
                          aria-current={active ? "true" : undefined}
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:brightness-95 ${focusRing}`}
                          style={
                            active
                              ? { color: "#fff", backgroundColor: fg }
                              : { color: fg, backgroundColor: bg }
                          }
                        >
                          {cat}
                        </Link>
                      );
                    })
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Search overlay ═══════════════════════════════════ */}
      <div
        className={`fn-motion fixed inset-0 z-[60] transition-opacity duration-200 ${
          searchOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        aria-hidden={!searchOpen}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
          aria-hidden="true"
        />
        <div
          className={`relative mx-auto mt-0 sm:mt-[8vh] w-full sm:w-[min(92vw,42rem)] max-h-[100dvh] sm:max-h-[80dvh] overflow-y-auto bg-white sm:rounded-2xl shadow-2xl transition-transform duration-200 ${
            searchOpen ? "translate-y-0" : "-translate-y-3"
          }`}
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 p-3 sm:p-4 border-b border-gray-100">
            <FiSearch className="ml-1 shrink-0 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, or keywords"
              className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
              aria-label="Search"
              tabIndex={searchOpen ? 0 : -1}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className={`rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black ${focusRing}`}
              >
                <FiX size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className={`rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 ${focusRing}`}
              aria-label="Close search"
            >
              Esc
            </button>
          </form>

          <div className="space-y-5 p-4 sm:p-5">
            {searchQuery.trim() ? (
              <button
                onClick={() => runSearch(searchQuery)}
                className={`flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 ${focusRing}`}
              >
                <span className="truncate">
                  Search news for <strong className="text-black">“{searchQuery.trim()}”</strong>
                </span>
                <FiChevronRight className="shrink-0 text-gray-400" />
              </button>
            ) : (
              <>
                {recentSearches.length > 0 && (
                  <section aria-label="Recent searches">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-gray-500">Recent searches</h2>
                      <button
                        onClick={clearRecentSearches}
                        className={`text-xs text-gray-400 hover:text-red-600 ${focusRing} rounded`}
                      >
                        Clear all
                      </button>
                    </div>
                    <ul>
                      {recentSearches.map((r) => (
                        <li key={r}>
                          <button
                            onClick={() => runSearch(r)}
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 ${focusRing}`}
                          >
                            <FiClock size={15} className="shrink-0 text-gray-400" />
                            <span className="truncate">{r}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {categories.length > 0 && (
                  <section aria-label="Popular topics">
                    <h2 className="mb-2 text-xs font-semibold text-gray-500">Popular topics</h2>
                    <div className="flex flex-wrap gap-2">
                      {categories.slice(0, 8).map((cat) => {
                        const { fg, bg } = beatColor(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => goToCategory(cat)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:brightness-95 ${focusRing}`}
                            style={{ color: fg, backgroundColor: bg }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          <p className="hidden sm:block border-t border-gray-100 px-5 py-2.5 text-[11px] text-gray-400">
            Tip: press / or Ctrl+K anywhere to search.
          </p>
        </div>
      </div>

      {/* ═══ Sidebar backdrop ═════════════════════════════════ */}
      <div
        className={`fn-motion fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ═══ Sidebar drawer (slides from the left, like the menu button) ═══ */}
      <aside
        id="sidebar-drawer"
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fn-motion fixed top-0 left-0 z-[56] h-[100dvh] w-[300px] sm:w-[360px] max-w-[88vw] bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out will-change-transform ${
          sidebarOpen ? "translate-x-0 visible" : "-translate-x-full invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!sidebarOpen}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/60 p-4">
            <Link to="/" onClick={closeSidebar} className={`flex items-center gap-2 rounded ${focusRing}`}>
              <FiFeather className="text-xl text-black" />
              <span className="text-sm font-bold">FeatheredNews</span>
            </Link>
            <button
              ref={closeButtonRef}
              onClick={closeSidebar}
              className={`rounded-full p-2 transition-colors duration-200 hover:bg-gray-200 ${focusRing}`}
              aria-label="Close menu"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* Mobile search shortcut */}
          <button
            onClick={() => {
              closeSidebar();
              setSearchOpen(true);
            }}
            className={`mx-4 mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 ${focusRing}`}
          >
            <FiSearch size={16} /> Search articles
          </button>

          {/* User card */}
          {user && (
            <div className="px-4 pt-4">
              <Link
                to={profileRoute}
                onClick={closeSidebar}
                className={`group flex items-center gap-3 rounded-xl bg-gradient-to-r from-gray-50 to-white p-3 ring-1 ring-gray-100 ${focusRing}`}
              >
                <UserAvatar user={user} initials={initials} className="h-12 w-12" textClass="text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {user?.fullname || "User"}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user?.email || ""}</p>
                  {isAdmin && (
                    <span className="mt-0.5 inline-block rounded bg-black px-2 py-0.5 text-[9px] font-bold text-white">
                      Admin
                    </span>
                  )}
                </div>
                <FiChevronRight
                  className="text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-black"
                  size={18}
                />
              </Link>
            </div>
          )}

          {/* Links */}
          <nav className="flex-1 overflow-y-auto overscroll-contain py-3" aria-label="Mobile">
            <ul className="space-y-0.5">
              {mobileNavItems.map((item) => {
                const active = isLinkActive(item.link);
                return (
                  <li key={item.label}>
                    <Link
                      to={item.link}
                      aria-current={active ? "page" : undefined}
                      onClick={closeSidebar}
                      className={`flex items-center px-5 py-3 transition-colors duration-200 hover:bg-gray-50 ${focusRing} ${
                        active ? "bg-gray-50 text-black" : "text-gray-700"
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-black" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50/60">
            <SocialLinks className="justify-center border-b border-gray-200 px-4 py-4" />
            <div className="p-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={closeSidebar}
                      className={`flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 ${focusRing}`}
                    >
                      <FiGrid size={16} /> Admin panel
                    </Link>
                  )}
                  <button
                    onClick={logoutHandler}
                    disabled={loggingOut}
                    className={`flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-60 ${focusRing}`}
                  >
                    <FiLogOut size={16} /> {loggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={closeSidebar}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800 ${focusRing}`}
                  >
                    <FiLogIn size={16} /> Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeSidebar}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 ${focusRing}`}
                  >
                    <FiUser size={16} /> Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
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

//   // ─── Refs ──────────────────────────────────────────────
//   const sidebarRef = useRef(null);
//   const menuButtonRef = useRef(null);
//   const closeButtonRef = useRef(null);
//   const searchInputRef = useRef(null);
//   const touchStartX = useRef(0);
//   const touchEndX = useRef(0);
//   const categoryFetched = useRef(false);

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
//   // Primary + secondary merged into a single centered list.
//   // The "Categories" item has been removed from desktop nav.
//   const navItems = useMemo(() => {
//     return [
//       { label: "Home", link: "/" },
//       { label: "News", link: "/news" },
//       { label: "Listen", link: "/audio" },
//       { label: "Advertise", link: "/advertise" },
//       { label: "About", link: "/about" },
//       { label: "Contact", link: "/contact" },
//       { label: "Privacy", link: "/privacy" },
//     ];
//   }, []);

//   // Keep a separate list for the mobile sidebar where the
//   // Categories sub-dropdown is still useful.
//   const mobileNavItems = useMemo(() => {
//     return [
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
//     ].filter((item) => item.sub?.length > 0 || item.link);
//   }, [categories]);

//   // ─── Close sidebar on route change ──────────────
//   useEffect(() => {
//     setSidebarOpen(false);
//     setMobileOpenDropdown(null);
//   }, [location.pathname, location.search]);

//   // ─── Outside click for sidebar ───────────────────────
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
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [sidebarOpen]);

//   // ─── ESC to close everything ────────────────────────
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") {
//         setSidebarOpen(false);
//         setMobileOpenDropdown(null);
//         setSearchOpen(false);
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

//         {/* ─── DESKTOP PRIMARY NAV (centered) ──── */}
//         <nav
//           aria-label="Primary"
//           className="hidden lg:block relative border-t border-gray-200"
//         >
//           <ul className="flex items-center justify-center gap-1 py-2.5">
//             {navItems.map((item) => (
//               <li key={item.label}>
//                 <Link
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
//               </li>
//             ))}
//           </ul>
//         </nav>
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

//           {/* Navigation Links (mobile) */}
//           <nav className="flex-1 overflow-y-auto py-2">
//             <ul className="space-y-0.5">
//               {mobileNavItems.map((item) => {
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



















