import React, { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import {
  Menu,
  X,
  User,
  BookOpen,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookKeyIcon,
  DollarSignIcon,
  BookCheck,
  Book,
  GraduationCap,
  CircleDashed,
  Users,
  Play,
  Pencil,
  Award,
  BookA,
  Feather,
  Sliders,
  Sheet,
  MousePointerSquareDashed,
  MessagesSquare,
  AlignEndVertical,
  Globe,
  Music, // ✅ use Globe from lucide-react instead of FaEarthAsia
} from "lucide-react";

// If you prefer react-icons/fa6, uncomment this and remove Globe above:
// import { FaEarthAsia } from "react-icons/fa6";

import { getData } from "@/context/userContext";

// ─── Breakpoints ────────────────────────────────────────
// < 768px  → mobile: sidebar hidden, opens as an off-canvas drawer
// 768–1023 → tablet: sidebar always visible, collapsed to an icon rail
// >= 1024  → desktop: sidebar always visible, expanded (manually collapsible)
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

const getScreenMode = () => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < MOBILE_BREAKPOINT) return "mobile";
  if (w < TABLET_BREAKPOINT) return "tablet";
  return "desktop";
};

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = getData();

  const NAVBAR_HEIGHT = 64;

  const [screenMode, setScreenMode] = useState(getScreenMode);
  const [collapsed, setCollapsed] = useState(() => getScreenMode() === "tablet");
  const [mobileOpen, setMobileOpen] = useState(false);

  const asideRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isMobile = screenMode === "mobile";
  // On mobile the drawer is either fully open (expanded look) or closed — never icon-only.
  const isCollapsed = isMobile ? false : collapsed;

  // ─── Responsive mode + default collapse state ──────────
  useEffect(() => {
    const handleResize = () => {
      const mode = getScreenMode();
      setScreenMode((prev) => {
        if (prev === mode) return prev;
        // Reset collapse behavior appropriately when crossing a breakpoint
        if (mode === "tablet") setCollapsed(true);
        if (mode === "desktop") setCollapsed(false);
        if (mode === "mobile") setMobileOpen(false);
        return mode;
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Close mobile drawer on route change ───────────────
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ─── Lock body scroll while mobile drawer is open ──────
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, mobileOpen]);

  // ─── ESC closes the mobile drawer ───────────────────────
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // ─── Outside click closes the mobile drawer ────────────
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickOutside = (e) => {
      if (
        asideRef.current &&
        !asideRef.current.contains(e.target) &&
        !toggleButtonRef.current?.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  // ─── Swipe-left to close on touch devices ──────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 60) {
      setMobileOpen(false);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const toggleDesktopCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const menuItems = [
    {
      title: "Users",
      icon: <Users size={20} />,
      path: "/admin/dashboard",
    },
    {
      title: "Create Posts",
      icon: <MousePointerSquareDashed size={20} />,
      path: "/admin/create-posts",
    },
    {
      title: "Hero Slides",
      icon: <Sliders size={20} />,
      path: "/admin/admin-hero",
    },
    {
      title: "Messages",
      icon: <MessagesSquare size={20} />,
      path: "/admin/admin-messages",
    },
    {
      title: "Advertise Inquiry",
      icon: <AlignEndVertical size={20} />,
      path: "/admin/admin-advertise",
    },
    {
      title: "Featured",
      icon: <Globe size={20} />, // ✅ changed from FaEarthAsia to Globe
      path: "/admin/admin-featured",
    },
    {
      title: "Audio",
      icon: <Music size={20} />,
      path: "/admin/admin-audio",
    },
  ];

  const logoutHandler = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true });
    // ✅ remove window.location.reload() – navigation already handles redirect
  };

  return (
    <>
      {/* ─── Mobile menu button — only rendered on mobile, floats above the navbar row ── */}
      {isMobile && !mobileOpen && (
        <button
          ref={toggleButtonRef}
          onClick={toggleMobileDrawer}
          aria-label="Open admin menu"
          aria-expanded={mobileOpen}
          className="fixed z-40 left-3 bottom-4 sm:left-4 sm:bottom-5 w-11 h-11 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all duration-200"
        >
          <Menu size={20} />
        </button>
      )}

      {/* ─── Mobile backdrop ─────────────────────────────── */}
      {isMobile && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
            mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside
        ref={asideRef}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        style={
          isMobile
            ? { top: 0, height: "100vh" }
            : { top: NAVBAR_HEIGHT, height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }
        }
        role={isMobile ? "dialog" : undefined}
        aria-modal={isMobile ? mobileOpen : undefined}
        aria-hidden={isMobile ? !mobileOpen : undefined}
        className={`
          fixed left-0 z-50
          text-gray-900
          border-r border-gray-200
          flex flex-col
          bg-white
          transition-all duration-300 ease-in-out
          ${isMobile ? "w-[78vw] max-w-[300px] shadow-2xl" : isCollapsed ? "w-[80px]" : "w-[280px]"}
          ${isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
        `}
      >
        {/* Header */}
        <div
          className={`
            flex items-center
            px-4 py-5
            border-b border-gray-200
            ${isCollapsed ? "justify-center" : "justify-between"}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-black text-white p-2 rounded-full flex-shrink-0">
              <Feather size={20} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-gray-900 truncate">Admin Panel</h1>
              </div>
            )}
          </div>

          {/* Mobile: close button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="text-gray-400 hover:text-gray-700 transition-colors duration-200 p-1 -m-1 rounded"
              aria-label="Close admin menu"
            >
              <X size={20} />
            </button>
          )}

          {/* Tablet/Desktop: collapse toggle */}
          {!isMobile && !isCollapsed && (
            <button
              onClick={toggleDesktopCollapse}
              className="text-gray-400 hover:text-gray-700 transition-colors duration-200"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {!isMobile && isCollapsed && (
            <button
              onClick={toggleDesktopCollapse}
              className="absolute -right-3 top-6 bg-black text-white rounded-full p-1 hover:bg-gray-800 transition-colors duration-200"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Menu */}
        <div
          className={`
            flex-1 px-3 py-4 space-y-1
            ${isCollapsed ? "overflow-hidden" : "overflow-y-auto"}
          `}
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center
                ${isCollapsed ? "justify-center" : "justify-start"}
                gap-3
                px-4 py-3
                rounded-xl
                transition-all duration-200
                ${isActive
                  ? "bg-gray-100 text-black"
                  : "text-gray-700 hover:bg-gray-50 hover:text-black"
                }
                ${isCollapsed ? "relative group" : ""}
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.title}</span>
              )}
              {isCollapsed && (
                <span className="
                  absolute left-full ml-4 px-3 py-1.5
                  bg-gray-900 text-white text-xs font-medium
                  rounded-lg shadow-lg
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  whitespace-nowrap
                  pointer-events-none
                  z-50
                ">
                  {item.title}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer – Logout */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={logoutHandler}
            className={`
              w-full flex items-center
              ${isCollapsed ? "justify-center" : "justify-start"}
              gap-3
              px-4 py-3
              rounded-xl
              text-red-600 hover:text-red-700
              hover:bg-red-50
              transition-all duration-200
              ${isCollapsed ? "relative group" : ""}
            `}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            {isCollapsed && (
              <span className="
                absolute left-full ml-4 px-3 py-1.5
                bg-gray-900 text-white text-xs font-medium
                rounded-lg shadow-lg
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                whitespace-nowrap
                pointer-events-none
                z-50
              ">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Spacer – keeps content from hiding behind sidebar ───
           Only reserved on tablet/desktop; on mobile the sidebar is
           an overlay drawer and takes up no layout space. ── */}
      {!isMobile && (
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${isCollapsed ? "w-[80px]" : "w-[280px]"}
          `}
        />
      )}
    </>
  );
};

export default AdminSidebar;
