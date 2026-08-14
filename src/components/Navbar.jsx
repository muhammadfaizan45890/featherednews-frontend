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

// ─── Debounce helper ──────────────────────────────────────
const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

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

  // ─── Lock body scroll when sidebar open ────────────────
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
      className={`w-full bg-white sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      {/* ─── Live Date/Time Bar ──────────────────────────── */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-7 sm:h-8 flex items-center justify-between text-[11px] sm:text-xs text-gray-500 font-medium">
          <span aria-live="off">
            <span className="hidden md:inline">{fullDate}</span>
            <span className="hidden sm:inline md:hidden">{mediumDate}</span>
            <span className="sm:hidden">{shortDate}</span>
          </span>
          <span className="tabular-nums" aria-live="off">
            <span className="hidden sm:inline">{timeWithSeconds}</span>
            <span className="sm:hidden">{timeNoSeconds}</span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* ─── Top Header ──────────────────────────────────── */}
        <div className="relative flex items-center justify-between py-3 sm:py-4 md:py-5 lg:py-4 xl:py-5">
          {/* Left: Hamburger + Search (always visible) */}
          <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
            <button
              ref={menuButtonRef}
              onClick={toggleSidebar}
              className="hover:text-black transition duration-300 rounded-full p-1 relative"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-drawer"
            >
              {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="hover:text-black transition duration-300 rounded-full p-1"
              aria-label="Toggle search"
            >
              <FiSearch size={18} className="sm:size-5" />
            </button>
          </div>

          {/* ─── Logo ────────────────────────────────────── */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
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
          </div>

          {/* Right: Social + Auth */}
          <div className="flex items-center gap-4 lg:gap-5">
            <div className="hidden lg:flex items-center gap-5 text-gray-600">
              <a href="#" aria-label="Facebook" className="hover:text-black transition duration-300 rounded-full p-1">
                <FaFacebookF size={18} />
              </a>
              <a href="https://x.com/feathered_pen" aria-label="Twitter" className="hover:text-black transition duration-300 rounded-full p-1">
                <FaXTwitter size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-black transition duration-300 rounded-full p-1">
                <FaInstagram size={18} />
              </a>
              <a href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo" aria-label="YouTube" className="hover:text-black transition duration-300 rounded-full p-1">
                <FaYoutube size={18} />
              </a>
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={profileRoute}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all duration-200 group"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 transition-all">
                      <AvatarImage src={getAvatarUrl(user?.avatar)} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
                        {getUserInitials()}
                        {getRoleBadge() && (
                          <span className="ml-0.5 text-[8px]">{getRoleBadge()}</span>
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {/* <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[90px] truncate">
                    {user?.fullname?.split(" ")[0] || "Profile"}
                  </span> */}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition duration-200 text-gray-600 hover:text-black"
                  aria-label="Log in"
                >
                  <User size={20} className="sm:size-[22px]" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── Mobile Strip (scrollable categories) – kept for quick access ── */}
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
                  className={`snap-start shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition duration-200 ${
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
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

      {/* ─── Sidebar (Drawer) – now visible on all screens ── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-40 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
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
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] max-w-[85vw] bg-white shadow-2xl transform transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-50 ${
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
              className="p-2 hover:bg-gray-200 rounded-full transition duration-200"
              aria-label="Close menu"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <Link
                to={profileRoute}
                onClick={closeSidebar}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-12 w-12 border-2 border-gray-300 group-hover:border-black transition-colors">
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
                <FiChevronRight className="text-gray-400 group-hover:text-black transition-colors" size={18} />
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
                        className={`flex items-center w-full px-4 py-3 text-left transition duration-150 hover:bg-gray-50 ${
                          isActive ? "bg-gray-50" : ""
                        }`}
                        aria-expanded={isOpen}
                      >
                        <span className="flex-1 font-medium text-gray-700">{item.label}</span>
                        <FiChevronDown
                          className={`transform transition-transform duration-200 text-gray-400 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          size={16}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          isOpen ? "max-h-[500px]" : "max-h-0"
                        }`}
                      >
                        <ul className="bg-gray-50/80 py-1">
                          {subItems.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                to={sub.link}
                                className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition duration-150"
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
                      className={`flex items-center px-4 py-3 transition duration-150 hover:bg-gray-50 ${
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
            <div className="flex justify-center gap-5 py-4 px-4 border-b border-gray-200">
              <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-black transition duration-200 rounded-full p-1">
                <FaFacebookF size={18} />
              </a>
              <a href="https://x.com/feathered_pen" aria-label="Twitter" className="text-gray-500 hover:text-black transition duration-200 rounded-full p-1">
                <FaXTwitter size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-black transition duration-200 rounded-full p-1">
                <FaInstagram size={18} />
              </a>
              <a href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo" aria-label="YouTube" className="text-gray-500 hover:text-black transition duration-200 rounded-full p-1">
                <FaYoutube size={18} />
              </a>
            </div>
            <div className="p-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  {userRole === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
                      onClick={closeSidebar}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={logoutHandler}
                    className="flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                    onClick={closeSidebar}
                  >
                    <FiLogIn size={16} />
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
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














// import React, { useState, useEffect, useRef } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import {
//   FiSearch,
//   FiMenu,
//   FiChevronDown,
//   FiX,
//   FiUser,
//   FiFeather,
//   FiLogOut,
//   FiLogIn,
//   FiSettings,
//   FiChevronRight,
// } from "react-icons/fi";
// import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { getData } from "@/context/userContext";
// import axios from "axios";
// import { toast } from "sonner";
// import API from "@/utils/api";
// import { User } from "lucide-react";
// import { FaXTwitter } from "react-icons/fa6";

// // ─── Helper: resolve avatar URL ──────────────────────
// const getAvatarUrl = (avatarPath) => {
//   try {
//     if (!avatarPath) return null;
//     if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
//       return avatarPath;
//     }
//     if (!API) return null;
//     const base = API.replace(/\/+$/, "");
//     const path = avatarPath.replace(/^\/+/, "");
//     return `${base}/${path}`;
//   } catch {
//     return null;
//   }
// };

// // ─── Helper: create a reliable API instance ──────────
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
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error),
//   );
//   return instance;
// };

// const api = getApiInstance();

// const Navbar = () => {
//   const { user, setUser } = getData();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [openDropdown, setOpenDropdown] = useState(null); // desktop nav dropdown
//   const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null); // drawer dropdown (kept separate on purpose)
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [categories, setCategories] = useState([]);
//   const [categoriesLoading, setCategoriesLoading] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const touchStartX = useRef(0);
//   const touchEndX = useRef(0);

//   const dropdownRef = useRef(null);
//   const mobileMenuRef = useRef(null);
//   const searchInputRef = useRef(null);
//   const menuButtonRef = useRef(null);
//   const closeButtonRef = useRef(null);

//   const accessToken = localStorage.getItem("accessToken");
//   const userRole = user?.role || "user";

//   // ─── Fetch categories from posts ──────────────────────
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         setCategoriesLoading(true);
//         const res = await api.get("/api/posts", {
//           params: { limit: 100, page: 1 },
//         });
//         const posts = res.data.data || [];
//         const uniqueCategories = [
//           ...new Set(posts.map((p) => p.category).filter(Boolean)),
//         ];
//         setCategories(uniqueCategories);
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//         setCategories([
//           "Travel",
//           "Food",
//           "Lifestyle",
//           "News",
//           "Business",
//           "Fashion",
//         ]);
//       } finally {
//         setCategoriesLoading(false);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // ─── Close mobile menu on route change ──────────────
//   useEffect(() => {
//     setMobileMenuOpen(false);
//     setMobileOpenDropdown(null);
//   }, [location.pathname]);

//   // ─── Close mobile menu on resize to desktop ──────────
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 1024) {
//         setMobileMenuOpen(false);
//         setMobileOpenDropdown(null);
//       }
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // ─── Single outside-click handler for desktop dropdown + mobile drawer ──
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       // Desktop nav dropdown
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setOpenDropdown(null);
//       }
//       // Mobile drawer (ignore clicks on the menu toggle button itself)
//       if (
//         mobileMenuOpen &&
//         mobileMenuRef.current &&
//         !mobileMenuRef.current.contains(e.target) &&
//         !menuButtonRef.current?.contains(e.target)
//       ) {
//         setMobileMenuOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [mobileMenuOpen]);

//   // ─── Close everything on escape key ──────────────────
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") {
//         setMobileMenuOpen(false);
//         setOpenDropdown(null);
//         setMobileOpenDropdown(null);
//         setSearchOpen(false);
//       }
//     };
//     document.addEventListener("keydown", handleEscape);
//     return () => document.removeEventListener("keydown", handleEscape);
//   }, []);

//   // ─── Simple focus trap inside the open drawer ────────
//   useEffect(() => {
//     if (!mobileMenuOpen) return;

//     // Move focus into the drawer when it opens
//     closeButtonRef.current?.focus();

//     const handleTab = (e) => {
//       if (e.key !== "Tab" || !mobileMenuRef.current) return;
//       const focusable = mobileMenuRef.current.querySelectorAll(
//         'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
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
//   }, [mobileMenuOpen]);

//   // ─── Auto‑focus search input when opened ──────────────
//   useEffect(() => {
//     if (searchOpen && searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, [searchOpen]);

//   // ─── Scroll listener – adds shadow when scrolled ──────
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   // ─── Live clock – ticks every second ──────────────────
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // ─── Lock body scroll when mobile menu is open ──────
//   useEffect(() => {
//     if (mobileMenuOpen) {
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
//   }, [mobileMenuOpen]);

//   // ─── Handlers ──────────────────────────────────────────
//   const toggleDropdown = (label) => {
//     setOpenDropdown(openDropdown === label ? null : label);
//   };

//   const toggleMobileDropdown = (label) => {
//     setMobileOpenDropdown(mobileOpenDropdown === label ? null : label);
//   };

//   const closeMobileMenu = () => {
//     setMobileMenuOpen(false);
//     setMobileOpenDropdown(null);
//   };

//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     const query = searchQuery.trim();
//     if (query) {
//       navigate(`/news?search=${encodeURIComponent(query)}`);
//       setSearchOpen(false);
//       setSearchQuery("");
//     }
//   };

//   // ─── Touch handlers for swipe to close ──────────────
//   const handleTouchStart = (e) => {
//     touchStartX.current = e.touches[0].clientX;
//     touchEndX.current = e.touches[0].clientX;
//   };

//   const handleTouchMove = (e) => {
//     touchEndX.current = e.touches[0].clientX;
//   };

//   const handleTouchEnd = () => {
//     if (touchStartX.current - touchEndX.current > 75) {
//       closeMobileMenu();
//     }
//     touchStartX.current = 0;
//     touchEndX.current = 0;
//   };

//   // ─── Navigation items (icons kept only for reference in desktop menu — none rendered in drawer) ──
//   const navItems = [
//     { label: "Home", link: "/" },
//     { label: "News", link: "/news" },
//     { label: "Listen", link: "/audio" },
//     {
//       label: "Categories",
//       sub: categories.map((cat) => ({
//         label: cat,
//         link: `/news?category=${encodeURIComponent(cat)}`,
//       })),
//     },
//     { label: "Advertise", link: "/advertise" },
//     { label: "Privacy", link: "/privacy" },
//     { label: "Contact", link: "/contact" },
//     { label: "About", link: "/about" },
//   ];

//   const getSubItems = (item) => {
//     return item.sub && Array.isArray(item.sub) ? item.sub : [];
//   };

//   const handleMouseEnter = (label, hasSub) => {
//     if (hasSub) setOpenDropdown(label);
//   };

//   const handleMouseLeave = () => {
//     setTimeout(() => setOpenDropdown(null), 150);
//   };

//   // ─── Auth helpers ──────────────────────────────────────
//   const getUserInitials = () => {
//     if (user?.fullname) {
//       const parts = user.fullname.split(" ");
//       return parts
//         .map((n) => n[0])
//         .join("")
//         .toUpperCase()
//         .slice(0, 2);
//     }
//     if (user?.email) return user.email[0].toUpperCase();
//     return "U";
//   };

//   const getRoleBadge = () => (userRole === "admin" ? "A" : null);
//   const profileRoute = userRole === "admin" ? "/admin/profile" : "/profile";

//   const logoutHandler = async () => {
//     try {
//       const res = await axios.post(
//         `${API}/user/logout`,
//         {},
//         {
//           headers: { Authorization: `Bearer ${accessToken}` },
//         },
//       );
//       if (res.data.success) {
//         setUser(null);
//         toast.success(res.data.message);
//         localStorage.clear();
//         navigate("/");
//         closeMobileMenu();
//       }
//     } catch {
//       toast.error("Logout failed");
//     }
//   };

//   // ─── Date/time formatting ──────────────────────────────
//   const fullDate = currentTime.toLocaleDateString("en-US", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
//   const mediumDate = currentTime.toLocaleDateString("en-US", {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
//   const shortDate = currentTime.toLocaleDateString("en-US", {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//   });
//   const timeWithSeconds = currentTime.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: true,
//   });
//   const timeNoSeconds = currentTime.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });

//   return (
//     <header
//       className={`w-full bg-white sticky top-0 z-50 transition-shadow duration-300 ${
//         isScrolled ? "shadow-md" : ""
//       }`}
//     >
//       {/* ===== LIVE DATE & TIME BAR ===== */}
//       <div className="border-b border-gray-100 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-8 sm:h-9 flex items-center justify-between text-[11px] sm:text-xs text-gray-500 font-medium">
//           <span aria-live="off">
//             <span className="hidden md:inline">{fullDate}</span>
//             <span className="hidden sm:inline md:hidden">{mediumDate}</span>
//             <span className="sm:hidden">{shortDate}</span>
//           </span>
//           <span className="tabular-nums" aria-live="off">
//             <span className="hidden sm:inline">{timeWithSeconds}</span>
//             <span className="sm:hidden">{timeNoSeconds}</span>
//           </span>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
//         {/* ===== TOP HEADER ===== */}
//         <div className="relative flex items-center justify-between py-4 sm:py-6 md:py-8 lg:py-10">
//           {/* Left: Mobile Menu + Search */}
//           <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
//             <button
//               ref={menuButtonRef}
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="hover:text-black transition duration-300 lg:hidden rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black relative"
//               aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
//               aria-expanded={mobileMenuOpen}
//               aria-controls="mobile-drawer"
//             >
//               {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
//             </button>
//             <button
//               onClick={() => setSearchOpen(!searchOpen)}
//               className="hover:text-black transition duration-300 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//               aria-label="Toggle search"
//             >
//               <FiSearch size={18} className="sm:size-5" />
//             </button>
//           </div>

//           {/* ─── LOGO – smaller on mobile ────────────────── */}
//           <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
//             <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
//               <FiFeather className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-black dark:text-white" />
//               <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-none">
//                 <span className="font-light text-gray-800 dark:text-gray-200">
//                   𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳
//                 </span>
//                 <span className="font-extrabold text-black dark:text-white">
//                   NEWS
//                 </span>
//               </h1>
//             </div>
//             <p className="tracking-[4px] sm:tracking-[6px] md:tracking-[8px] uppercase text-[10px] sm:text-[11px] md:text-[12px] mt-1 sm:mt-2 text-gray-400 dark:text-gray-500 font-light">
//               Stories That Soar
//             </p>
//           </div>

//           {/* Right: Social Icons + Auth */}
//           <div className="flex items-center gap-4 lg:gap-5">
//             <div className="hidden lg:flex items-center gap-5 text-gray-600">
//               <a
//                 href="#"
//                 aria-label="Facebook"
//                 className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaFacebookF size={18} />
//               </a>
//               <a
//                 href="https://x.com/feathered_pen"
//                 aria-label="Twitter"
//                 className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaXTwitter size={18} />
//               </a>
//               <a
//                 href="#"
//                 aria-label="Instagram"
//                 className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaInstagram size={18} />
//               </a>
//               <a
//                 href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
//                 aria-label="YouTube"
//                 className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaYoutube size={18} />
//               </a>
//             </div>

//             {/* ─── Auth Section ─────────────────────────────── */}
//             {user ? (
//               <div className="flex items-center gap-3">
//                 <Link
//                   to={profileRoute}
//                   className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                 >
//                   <div className="relative">
//                     <Avatar className="h-8 w-8 border-2 border-gray-200 transition-all">
//                       <AvatarImage src={getAvatarUrl(user?.avatar)} />
//                       <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
//                         {getUserInitials()}
//                         {getRoleBadge() && (
//                           <span className="ml-0.5 text-[8px]">
//                             {getRoleBadge()}
//                           </span>
//                         )}
//                       </AvatarFallback>
//                     </Avatar>
//                   </div>
//                   <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[90px] truncate">
//                     {user?.fullname?.split(" ")[0] || "Profile"}
//                   </span>
//                 </Link>
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Link
//                   to="/login"
//                   className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition duration-200 text-gray-600 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                   aria-label="Log in"
//                 >
//                   <User size={20} className="sm:size-[22px]" />
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ===== MOBILE NAVIGATION LINKS ===== */}
//         <div className="lg:hidden flex justify-center items-center gap-6 py-2 border-t border-gray-200">
//           <Link
//             to="/"
//             className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
//             onClick={() => setMobileMenuOpen(false)}
//           >
//             Home
//           </Link>
//           <Link
//             to="/news"
//             className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
//             onClick={() => setMobileMenuOpen(false)}
//           >
//             News
//           </Link>
//           <Link
//             to="/advertise"
//             className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
//             onClick={() => setMobileMenuOpen(false)}
//           >
//             Advertise
//           </Link>
//           <Link
//             to="/audio"
//             className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
//             onClick={() => setMobileMenuOpen(false)}
//           >
//             Audio
//           </Link>
//         </div>
//       </div>

//       {/* ===== SEARCH BAR ===== */}
//       <div
//         className={`overflow-hidden transition-all duration-300 ease-in-out ${
//           searchOpen ? "max-h-20 border-none" : "max-h-0"
//         }`}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3">
//           <form onSubmit={handleSearchSubmit} className="relative">
//             <FiSearch
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//               size={18}
//             />
//             <input
//               ref={searchInputRef}
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search articles, topics, or keywords..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
//               aria-label="Search"
//             />
//           </form>
//         </div>
//       </div>

//       {/* ===== DESKTOP NAVIGATION ===== */}
//       <nav className="hidden lg:block">
//         <ul
//           ref={dropdownRef}
//           className="flex flex-wrap justify-center items-center gap-6 xl:gap-10 py-3 text-[13px] xl:text-[14px] font-semibold uppercase"
//         >
//           {navItems.map((item) => {
//             const subItems = getSubItems(item);
//             const hasSub = subItems.length > 0;

//             return (
//               <li
//                 key={item.label}
//                 className="relative"
//                 onMouseEnter={() => handleMouseEnter(item.label, hasSub)}
//                 onMouseLeave={handleMouseLeave}
//               >
//                 {hasSub ? (
//                   <>
//                     <button
//                       onClick={() => toggleDropdown(item.label)}
//                       className="flex items-center gap-1 hover:text-black transition duration-300 border-none rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                       aria-expanded={openDropdown === item.label}
//                     >
//                       {item.label}
//                       <FiChevronDown
//                         size={14}
//                         className={`transform transition-transform duration-200 ${
//                           openDropdown === item.label ? "rotate-180" : ""
//                         }`}
//                       />
//                     </button>
//                     {openDropdown === item.label && (
//                       <ul className="absolute left-0 mt-2 w-52 bg-white shadow-lg rounded-md border-none py-2 z-20">
//                         {subItems.map((sub) => (
//                           <li key={sub.label}>
//                             <Link
//                               to={sub.link}
//                               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                               onClick={() => setOpenDropdown(null)}
//                             >
//                               {sub.label}
//                             </Link>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </>
//                 ) : (
//                   <a
//                     href={item.link}
//                     className="hover:text-black transition duration-300 inline-block px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                   >
//                     {item.label}
//                   </a>
//                 )}
//               </li>
//             );
//           })}
//         </ul>
//       </nav>

//       {/* ===== ADVANCED MOBILE DRAWER ===== */}
//       {/* Backdrop with blur */}
//       <div
//         className={`fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300 z-40 ${
//           mobileMenuOpen
//             ? "opacity-100 pointer-events-auto"
//             : "opacity-0 pointer-events-none"
//         }`}
//         onClick={closeMobileMenu}
//         aria-hidden="true"
//       />

//       {/* Sidebar */}
//       <div
//         id="mobile-drawer"
//         ref={mobileMenuRef}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//         onTouchEnd={handleTouchEnd}
//         className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] max-w-[85vw] bg-white shadow-2xl transform transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-50 lg:hidden ${
//           mobileMenuOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//         role="dialog"
//         aria-modal="true"
//         aria-label="Mobile menu"
//         aria-hidden={!mobileMenuOpen}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header with close button */}
//           <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
//             <div className="flex items-center gap-2">
//               <FiFeather className="text-xl text-black" />
//               <span className="font-bold text-sm">Menu</span>
//             </div>
//             <button
//               ref={closeButtonRef}
//               onClick={closeMobileMenu}
//               className="p-2 hover:bg-gray-200 rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//               aria-label="Close menu"
//             >
//               <FiX size={24} />
//             </button>
//           </div>

//           {/* User Profile Section */}
//           {user && (
//             <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
//               <Link
//                 to={profileRoute}
//                 onClick={closeMobileMenu}
//                 className="flex items-center gap-3 group"
//               >
//                 <Avatar className="h-12 w-12 border-2 border-gray-300 group-hover:border-black transition-colors">
//                   <AvatarImage src={getAvatarUrl(user?.avatar)} />
//                   <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-bold">
//                     {getUserInitials()}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {user?.fullname || "User"}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {user?.email || ""}
//                   </p>
//                   {userRole === "admin" && (
//                     <span className="inline-block mt-0.5 text-[9px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
//                       Admin
//                     </span>
//                   )}
//                 </div>
//                 <FiChevronRight className="text-gray-400 group-hover:text-black transition-colors" size={18} />
//               </Link>
//             </div>
//           )}

//           {/* Navigation Links — icons removed */}
//           <nav className="flex-1 overflow-y-auto py-2">
//             <ul className="space-y-0.5">
//               {navItems.map((item) => {
//                 const subItems = getSubItems(item);
//                 const hasSub = subItems.length > 0;
//                 const isActive = location.pathname === item.link;

//                 if (hasSub) {
//                   const isOpen = mobileOpenDropdown === item.label;
//                   return (
//                     <li key={item.label} className="border-b border-gray-100 last:border-0">
//                       <button
//                         onClick={() => toggleMobileDropdown(item.label)}
//                         className={`flex items-center w-full px-4 py-3 text-left transition duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
//                           isActive ? "bg-gray-50" : ""
//                         }`}
//                         aria-expanded={isOpen}
//                       >
//                         <span className="flex-1 font-medium text-gray-700">{item.label}</span>
//                         <FiChevronDown
//                           className={`transform transition-transform duration-200 text-gray-400 ${
//                             isOpen ? "rotate-180" : ""
//                           }`}
//                           size={16}
//                         />
//                       </button>
//                       <div
//                         className={`overflow-hidden transition-all duration-200 ${
//                           isOpen ? "max-h-[500px]" : "max-h-0"
//                         }`}
//                       >
//                         <ul className="bg-gray-50/80 py-1">
//                           {subItems.map((sub) => (
//                             <li key={sub.label}>
//                               <Link
//                                 to={sub.link}
//                                 className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                                 onClick={closeMobileMenu}
//                               >
//                                 {sub.label}
//                               </Link>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     </li>
//                   );
//                 }

//                 return (
//                   <li key={item.label}>
//                     <Link
//                       to={item.link}
//                       className={`flex items-center px-4 py-3 transition duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
//                         isActive ? "bg-gray-50 text-black" : "text-gray-700"
//                       }`}
//                       onClick={closeMobileMenu}
//                     >
//                       <span className="font-medium">{item.label}</span>
//                       {isActive && (
//                         <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />
//                       )}
//                     </Link>
//                   </li>
//                 );
//               })}
//             </ul>
//           </nav>

//           {/* Footer with actions */}
//           <div className="border-t border-gray-200 bg-gray-50/50">
//             {/* Social Icons */}
//             <div className="flex justify-center gap-5 py-4 px-4 border-b border-gray-200">
//               <a
//                 href="#"
//                 aria-label="Facebook"
//                 className="text-gray-500 hover:text-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaFacebookF size={18} />
//               </a>
//               <a
//                 href="https://x.com/feathered_pen"
//                 aria-label="Twitter"
//                 className="text-gray-500 hover:text-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaXTwitter size={18} />
//               </a>
//               <a
//                 href="#"
//                 aria-label="Instagram"
//                 className="text-gray-500 hover:text-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaInstagram size={18} />
//               </a>
//               <a
//                 href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
//                 aria-label="YouTube"
//                 className="text-gray-500 hover:text-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
//               >
//                 <FaYoutube size={18} />
//               </a>
//             </div>

//             {/* Auth Actions */}
//             <div className="p-4">
//               {user ? (
//                 <div className="flex flex-col gap-2">
//                   {userRole === "admin" && (
//                     <Link
//                       to="/admin/dashboard"
//                       className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                       onClick={closeMobileMenu}
//                     >
//                       Admin Panel
//                     </Link>
//                   )}
//                   <button
//                     onClick={logoutHandler}
//                     className="flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
//                   >
//                     Sign Out
//                   </button>
//                 </div>
//               ) : (
//                 <div className="flex gap-2">
//                   <Link
//                     to="/login"
//                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                     onClick={closeMobileMenu}
//                   >
//                     <FiLogIn size={16} />
//                     Log In
//                   </Link>
//                   <Link
//                     to="/signup"
//                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
//                     onClick={closeMobileMenu}
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
