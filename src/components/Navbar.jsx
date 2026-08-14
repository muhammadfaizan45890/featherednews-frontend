import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getData } from "@/context/userContext";
import axios from "axios";
import { toast } from "sonner";
import API from "@/utils/api";
import { User } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────
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

const Navbar = () => {
  const { user, setUser } = getData();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── State ──────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ─── Refs ──────────────────────────────────────────────
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const categoryFetched = useRef(false);

  const accessToken = localStorage.getItem("accessToken");
  const userRole = user?.role || "user";

  // ─── Fetch categories (once) ──────────────────────────
  useEffect(() => {
    if (categoryFetched.current) return;
    categoryFetched.current = true;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await api.get("/api/posts", { params: { limit: 100, page: 1 } });
        const posts = res.data.data || [];
        const unique = [...new Set(posts.map((p) => p.category).filter(Boolean))];
        setCategories(unique);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories(["Travel", "Food", "Lifestyle", "News", "Business", "Fashion"]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ─── Memoized nav items ──────────────────────────────
  const navItems = useMemo(() => {
    const base = [
      { label: "Home", link: "/" },
      { label: "News", link: "/news" },
      { label: "Listen", link: "/audio" },
      {
        label: "Categories",
        sub: categories.map((cat) => ({
          label: cat,
          link: `/news?category=${encodeURIComponent(cat)}`,
        })),
      },
      { label: "Advertise", link: "/advertise" },
      { label: "Privacy", link: "/privacy" },
      { label: "Contact", link: "/contact" },
      { label: "About", link: "/about" },
    ];
    return base.filter((item) => item.sub?.length > 0 || item.link);
  }, [categories]);

  // ─── Close sidebar on route change ────────────────────
  useEffect(() => {
    setSidebarOpen(false);
    setMobileOpenDropdown(null);
  }, [location.pathname]);

  // ─── Outside click for sidebar ──────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !menuButtonRef.current?.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  // ─── ESC to close everything ────────────────────────
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setMobileOpenDropdown(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ─── Focus trap for sidebar ──────────────────────────
  useEffect(() => {
    if (!sidebarOpen) return;
    closeButtonRef.current?.focus();

    const handleTab = (e) => {
      if (e.key !== "Tab" || !sidebarRef.current) return;
      const focusable = sidebarRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
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
    return () => document.removeEventListener("keydown", handleTab);
  }, [sidebarOpen]);

  // ─── Auto‑focus search input ────────────────────────
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // ─── Scroll shadow ─────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Live clock ──────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Lock body scroll when sidebar open ──────────────
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [sidebarOpen]);

  // ─── Handlers ──────────────────────────────────────────
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
    setMobileOpenDropdown(null);
  }, []);

  const toggleMobileDropdown = useCallback((label) => {
    setMobileOpenDropdown((prev) => (prev === label ? null : label));
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setMobileOpenDropdown(null);
  }, []);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const query = searchQuery.trim();
      if (query) {
        navigate(`/news?search=${encodeURIComponent(query)}`);
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    [searchQuery, navigate]
  );

  // ─── Touch swipe to close sidebar ────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) {
      closeSidebar();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // ─── Auth helpers ──────────────────────────────────
  const getUserInitials = () => {
    if (user?.fullname) {
      const parts = user.fullname.split(" ");
      return parts.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getRoleBadge = () => (userRole === "admin" ? "A" : null);
  const profileRoute = userRole === "admin" ? "/admin/profile" : "/profile";

  const logoutHandler = useCallback(async () => {
    try {
      const res = await api.post("/user/logout", {}, { headers: { Authorization: `Bearer ${accessToken}` } });
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

  // Helper to check if a category is active
  const isCategoryActive = (category) => {
    const params = new URLSearchParams(location.search);
    return params.get("category") === category;
  };

  // ─── Date formatting ──────────────────────────────
  const fullDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const mediumDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const shortDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeWithSeconds = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const timeNoSeconds = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // ─── Render ──────────────────────────────────────────
  return (
    <header
      className={`w-full bg-white sticky top-0 z-50 ${isScrolled ? "shadow-sm" : ""}`}
    >
      {/* ─── Live Date/Time Bar ──────────────────────────── */}
      <div className="border-b border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-7 sm:h-8 flex items-center justify-between text-[11px] sm:text-xs text-white font-medium">
          <span aria-live="off">
            <span className="hidden md:inline">{fullDate}</span>
            <span className="hidden sm:inline md:hidden">{mediumDate}</span>
            <span className="sm:hidden">{shortDate}</span>
          </span>
          <span className="tabular-nums text-gray-300" aria-live="off">
            <span className="hidden sm:inline">{timeWithSeconds}</span>
            <span className="sm:hidden">{timeNoSeconds}</span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* ─── Top Header ──────────────────────────────────── */}
        <div className="relative flex items-center justify-between py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5">
          {/* Left: Hamburger + Search */}
          <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
            <button
              ref={menuButtonRef}
              onClick={toggleSidebar}
              className="hover:text-black rounded-full p-1"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-drawer"
            >
              {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="hover:text-black rounded-full p-1"
              aria-label="Toggle search"
            >
              <FiSearch size={18} className="sm:size-5" />
            </button>
          </div>

          {/* ─── Logo (clickable) ────────────────────────── */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
              <FiFeather className="text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl text-black" />
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl font-black tracking-tight leading-none">
                <span className="font-light text-gray-800">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
                <span className="font-extrabold text-black">NEWS</span>
              </h1>
            </div>
            <p className="tracking-[4px] sm:tracking-[6px] md:tracking-[8px] uppercase text-[10px] sm:text-[11px] md:text-[12px] mt-1 sm:mt-2 text-gray-400 font-light">
              Stories That Soar
            </p>
          </Link>

          {/* Right: Social + Auth */}
          <div className="flex items-center gap-4 lg:gap-5">
            {/* Desktop social icons with border & rounded */}
            <div className="hidden lg:flex items-center gap-2.5 text-gray-600">
              <a
                href="#"
                aria-label="Facebook"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black"
              >
                <FaFacebookF size={16} />
              </a>
              <a
                href="https://x.com/feathered_pen"
                aria-label="Twitter"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black"
              >
                <FaXTwitter size={16} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black"
              >
                <FaInstagram size={16} />
              </a>
              <a
                href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
                aria-label="YouTube"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black"
              >
                <FaYoutube size={16} />
              </a>
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={profileRoute}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 group"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(user?.avatar)} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
                        {getUserInitials()}
                        {getRoleBadge() && (
                          <span className="ml-0.5 text-[8px]">{getRoleBadge()}</span>
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-gray-600 hover:text-black"
                  aria-label="Log in"
                >
                  <User size={20} className="sm:size-[22px]" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── DESKTOP CATEGORIES STRIP (hidden on mobile) ── */}
        <div className="hidden lg:block relative border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-2">
            <div className="flex items-center gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/news"
                className={`snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border ${
                  location.pathname === "/news" && !new URLSearchParams(location.search).get("category")
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => {
                const active = isCategoryActive(cat);
                return (
                  <Link
                    key={cat}
                    to={`/news?category=${encodeURIComponent(cat)}`}
                    className={`snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
            <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
          </div>
        </div>

        {/* ─── Mobile Strip (scrollable categories) ── */}
        <div className="lg:hidden relative border-t border-gray-200">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { label: "Home", link: "/" },
              { label: "News", link: "/news" },
              { label: "Listen", link: "/audio" },
              ...categories.slice(0, 6).map((cat) => ({
                label: cat,
                link: `/news?category=${encodeURIComponent(cat)}`,
              })),
              { label: "Advertise", link: "/advertise" },
            ].map((item) => {
              const isActive = location.pathname === item.link;
              return (
                <Link
                  key={item.label}
                  to={item.link}
                  className={`snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
                  }`}
                  onClick={closeSidebar}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>

      {/* ─── Search Bar ────────────────────────────────────── */}
      <div
        className={`overflow-hidden ${
          searchOpen ? "max-h-20 border-t border-gray-200" : "max-h-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, or keywords..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              aria-label="Search"
            />
          </form>
        </div>
      </div>

      {/* ─── Sidebar (Drawer) – visible on all screens ── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <div
        id="sidebar-drawer"
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] max-w-[85vw] bg-white z-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <FiFeather className="text-xl text-black" />
              <span className="font-bold text-sm">Menu</span>
            </div>
            <button
              ref={closeButtonRef}
              onClick={closeSidebar}
              className="p-2 hover:bg-gray-200 rounded-full"
              aria-label="Close menu"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
              <Link
                to={profileRoute}
                onClick={closeSidebar}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getAvatarUrl(user?.avatar)} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.fullname || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                  {userRole === "admin" && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <FiChevronRight className="text-gray-400 group-hover:text-black" size={18} />
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-2">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const subItems = item.sub || [];
                const hasSub = subItems.length > 0;
                const isActive = location.pathname === item.link;

                if (hasSub) {
                  const isOpen = mobileOpenDropdown === item.label;
                  return (
                    <li key={item.label} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => toggleMobileDropdown(item.label)}
                        className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 ${
                          isActive ? "bg-gray-50" : ""
                        }`}
                        aria-expanded={isOpen}
                      >
                        <span className="flex-1 font-medium text-gray-700">{item.label}</span>
                        <FiChevronDown
                          className={`transform ${
                            isOpen ? "rotate-180" : ""
                          } text-gray-400`}
                          size={16}
                        />
                      </button>
                      <div
                        className={`overflow-hidden ${
                          isOpen ? "max-h-[500px]" : "max-h-0"
                        }`}
                      >
                        <ul className="bg-gray-50/80 py-1">
                          {subItems.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                to={sub.link}
                                className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-black"
                                onClick={closeSidebar}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      to={item.link}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 ${
                        isActive ? "bg-gray-50 text-black" : "text-gray-700"
                      }`}
                      onClick={closeSidebar}
                    >
                      <span className="font-medium">{item.label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50/50">
            {/* Sidebar social icons with border & rounded */}
            <div className="flex justify-center gap-2.5 py-4 px-4 border-b border-gray-200">
              <a
                href="#"
                aria-label="Facebook"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600"
              >
                <FaFacebookF size={16} />
              </a>
              <a
                href="https://x.com/feathered_pen"
                aria-label="Twitter"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600"
              >
                <FaXTwitter size={16} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600"
              >
                <FaInstagram size={16} />
              </a>
              <a
                href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
                aria-label="YouTube"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-600"
              >
                <FaYoutube size={16} />
              </a>
            </div>
            <div className="p-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  {userRole === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
                      onClick={closeSidebar}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={logoutHandler}
                    className="flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                    onClick={closeSidebar}
                  >
                    <FiLogIn size={16} />
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
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
