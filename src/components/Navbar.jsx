import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiSearch,
  FiMenu,
  FiChevronDown,
  FiX,
  FiUser,
  FiFeather,
} from "react-icons/fi";
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getData } from "@/context/userContext";
import axios from "axios";
import { toast } from "sonner";
import API from "@/utils/api";
import { User } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";

// ─── Helper: resolve avatar URL ──────────────────────
const getAvatarUrl = (avatarPath) => {
  try {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      return avatarPath;
    }
    if (!API) return null;
    const base = API.replace(/\/+$/, "");
    const path = avatarPath.replace(/^\/+/, "");
    return `${base}/${path}`;
  } catch {
    return null;
  }
};

// ─── Helper: create a reliable API instance ──────────
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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
  return instance;
};

const api = getApiInstance();

const Navbar = () => {
  const { user, setUser } = getData();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  const accessToken = localStorage.getItem("accessToken");
  const userRole = user?.role || "user";

  // ─── Fetch categories from posts ──────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await api.get("/api/posts", {
          params: { limit: 100, page: 1 },
        });
        const posts = res.data.data || [];
        const uniqueCategories = [
          ...new Set(posts.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          "Travel",
          "Food",
          "Lifestyle",
          "News",
          "Business",
          "Fashion",
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ─── Close mobile menu on route change ──────────────
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ─── Close mobile menu on resize to desktop ──────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Close dropdowns on outside click ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Close mobile menu on escape key ──────────────────
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ─── Close mobile menu on outside click ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // ─── Auto‑focus search input when opened ──────────────
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // ─── Scroll listener – adds shadow when scrolled ──────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Live clock – ticks every second ──────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Handlers ──────────────────────────────────────────
  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/news?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // ─── Navigation items ──────────────────────────────────
  const navItems = [
    { label: "Home", link: "/" },
    { label: "News", link: "/news" },
    {
      label: "Categories",
      sub: categories.map((cat) => ({
        label: cat,
        link: `/news?category=${encodeURIComponent(cat)}`,
      })),
    },
    { label: "Advertise", link: "/advertise" },
    { label: "Privacy and Policy", link: "/privacy" },
    { label: "Contact", link: "/contact" },
    { label: "About", link: "/about" },
  ];

  const getSubItems = (item) => {
    return item.sub && Array.isArray(item.sub) ? item.sub : [];
  };

  const handleMouseEnter = (label, hasSub) => {
    if (hasSub) setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    setTimeout(() => setOpenDropdown(null), 150);
  };

  // ─── Auth helpers ──────────────────────────────────────
  const getUserInitials = () => {
    if (user?.fullname) {
      const parts = user.fullname.split(" ");
      return parts
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getRoleBadge = () => (userRole === "admin" ? "A" : null);
  const profileRoute = userRole === "admin" ? "/admin/profile" : "/profile";

  const logoutHandler = async () => {
    try {
      const res = await axios.post(
        `${API}/user/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (res.data.success) {
        setUser(null);
        toast.success(res.data.message);
        localStorage.clear();
        navigate("/");
      }
    } catch {
      toast.error("Logout failed");
    }
  };

  // ─── Date/time formatting ──────────────────────────────
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

  return (
    <header
      className={`w-full bg-white sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      {/* ===== LIVE DATE & TIME BAR ===== */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-8 sm:h-9 flex items-center justify-between text-[11px] sm:text-xs text-gray-500 font-medium">
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
        {/* ===== TOP HEADER ===== */}
        <div className="relative flex items-center justify-between py-4 sm:py-6 md:py-8 lg:py-10">
          {/* Left: Mobile Menu + Search */}
          <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:text-black transition duration-300 lg:hidden rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:text-black transition duration-300 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              aria-label="Toggle search"
            >
              <FiSearch size={18} className="sm:size-5" />
            </button>
          </div>

          {/* ─── LOGO – smaller on mobile ────────────────── */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
              <FiFeather className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-black dark:text-white" />
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-none">
                <span className="font-light text-gray-800 dark:text-gray-200">
                  𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳
                </span>
                <span className="font-extrabold text-black dark:text-white">
                  NEWS
                </span>
              </h1>
            </div>
            <p className="tracking-[4px] sm:tracking-[6px] md:tracking-[8px] uppercase text-[10px] sm:text-[11px] md:text-[12px] mt-1 sm:mt-2 text-gray-400 dark:text-gray-500 font-light">
              Stories That Soar
            </p>
          </div>

          {/* Right: Social Icons + Auth */}
          <div className="flex items-center gap-4 lg:gap-5">
            <div className="hidden lg:flex items-center gap-5 text-gray-600">
              <a
                href="#"
                aria-label="Facebook"
                className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://x.com/feathered_pen"
                aria-label="Twitter"
                className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaXTwitter size={18} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
                aria-label="YouTube"
                className="hover:text-black transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaYoutube size={18} />
              </a>
            </div>

            {/* ─── Auth Section ─────────────────────────────── */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={profileRoute}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 border-2 border-gray-200 transition-all">
                      <AvatarImage src={getAvatarUrl(user?.avatar)} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-bold">
                        {getUserInitials()}
                        {getRoleBadge() && (
                          <span className="ml-0.5 text-[8px]">
                            {getRoleBadge()}
                          </span>
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[90px] truncate">
                    {user?.fullname?.split(" ")[0] || "Profile"}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition duration-200 text-gray-600 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  aria-label="Log in"
                >
                  <User size={20} className="sm:size-[22px]" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ===== MOBILE NAVIGATION LINKS ===== */}
        <div className="lg:hidden flex justify-center items-center gap-6 py-2 border-t border-gray-200">
          <Link
            to="/"
            className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/news"
            className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            News
          </Link>
          <Link
            to="/advertise"
            className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            Advertise
          </Link>
          <Link
            to="/about"
            className="text-sm font-semibold text-gray-700 hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded px-2 py-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
        </div>
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          searchOpen ? "max-h-20 border-none" : "max-h-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <form onSubmit={handleSearchSubmit} className="relative">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              aria-label="Search"
            />
          </form>
        </div>
      </div>

      {/* ===== DESKTOP NAVIGATION ===== */}
      <nav className="hidden lg:block">
        <ul
          ref={dropdownRef}
          className="flex flex-wrap justify-center items-center gap-6 xl:gap-10 py-3 text-[13px] xl:text-[14px] font-semibold uppercase"
        >
          {navItems.map((item) => {
            const subItems = getSubItems(item);
            const hasSub = subItems.length > 0;
            const isButton = !!item.isButton;

            return (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.label, hasSub)}
                onMouseLeave={handleMouseLeave}
              >
                {isButton ? (
                  <a
                    href={item.link}
                    className="px-5 py-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition duration-300 text-xs font-bold inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {item.label}
                  </a>
                ) : hasSub ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className="flex items-center gap-1 hover:text-black transition duration-300 border-none rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      aria-expanded={openDropdown === item.label}
                    >
                      {item.label}
                      <FiChevronDown
                        size={14}
                        className={`transform transition-transform duration-200 ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openDropdown === item.label && (
                      <ul className="absolute left-0 mt-2 w-52 bg-white shadow-lg rounded-md border-none py-2 z-20">
                        {subItems.map((sub) => (
                          <li key={sub.label}>
                            <Link
                              to={sub.link}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                              onClick={closeMobileMenu}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <a
                    href={item.link}
                    className="hover:text-black transition duration-300 inline-block px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity duration-300 z-40 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              aria-label="Close menu"
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const subItems = getSubItems(item);
                const hasSub = subItems.length > 0;
                const isButton = !!item.isButton;

                if (isButton) {
                  return (
                    <li key={item.label} className="px-4 mt-4">
                      <a
                        href={item.link}
                        className="block w-full px-4 py-3 bg-black text-white rounded-lg text-center font-bold uppercase hover:bg-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        onClick={closeMobileMenu}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                }

                if (hasSub) {
                  const isOpen = openDropdown === item.label;
                  return (
                    <li key={item.label} className="border-b border-gray-100">
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left font-medium hover:bg-gray-50 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        aria-expanded={isOpen}
                      >
                        <span>{item.label}</span>
                        <FiChevronDown
                          className={`transform transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          size={16}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          isOpen ? "max-h-60" : "max-h-0"
                        }`}
                      >
                        <ul className="bg-gray-50/50 py-1">
                          {subItems.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                to={sub.link}
                                className="block px-8 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                                onClick={closeMobileMenu}
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
                    <a
                      href={item.link}
                      className="block px-4 py-3 font-medium hover:bg-gray-50 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-5 border-t border-gray-200 space-y-4">
            <div className="flex justify-center gap-6 text-gray-600">
              <a
                href="#"
                aria-label="Facebook"
                className="hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://x.com/feathered_pen"
                aria-label="Twitter"
                className="hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaXTwitter size={18} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://youtube.com/@featheredpen1?si=AXxxHTs8adUmQQlo"
                aria-label="YouTube"
                className="hover:text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full p-1"
              >
                <FaYoutube size={18} />
              </a>
            </div>

            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  to={profileRoute}
                  className="block text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  onClick={closeMobileMenu}
                >
                  Profile
                </Link>
                {userRole === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="block text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    onClick={closeMobileMenu}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    logoutHandler();
                    closeMobileMenu();
                  }}
                  className="block w-full text-center px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  onClick={closeMobileMenu}
                >
                  <FiUser size={18} />
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
