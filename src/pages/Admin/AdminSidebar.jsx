// import React, { useEffect, useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";

// import {
//   LayoutDashboard,
//   User,
//   BookOpen,
//   Heart,
//   Settings,
//   LogOut,
//   ChevronLeft,
//   ChevronRight,
//   ShieldCheck,
//   BookKeyIcon,
//   DollarSignIcon,
//   BookCheck,
//   Book,
//   GraduationCap,
//   CircleDashed,
//   Users,
//   Play,
//   Pencil,
//   Award,
//   BookA,
//   Feather,
//   Sliders,
//   Sheet,
//   MousePointerSquareDashed,
//   MessagesSquare,
//   AlignEndVertical,
// } from "lucide-react";

// // Import user context to clear state on logout
// import { getData } from "@/context/userContext";

// const AdminSidebar = () => {
//   const navigate = useNavigate();
//   const { setUser } = getData(); // to clear global user

//   const NAVBAR_HEIGHT = 64;

//   // ================= STATES =================
//   const [collapsed, setCollapsed] = useState(false);
//   const [, setIsMobile] = useState(false);

//   // ================= RESPONSIVE =================
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 1024;
//       setIsMobile(mobile);
//       if (mobile) {
//         setCollapsed(true);
//       } else {
//         setCollapsed(false);
//       }
//     };

//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // ================= MENU =================
//   const menuItems = [
//     {
//       title: "Users",
//       icon: <Users size={20} />,
//       path: "/admin/dashboard"
//     },
//     // {
//     //   title: "Enrolled Students",
//     //   icon: <Users size={20} />,
//     //   path: "/admin/users"
//     // },
//         {
//       title: "Create Posts",
//       icon: <MousePointerSquareDashed size={20} />,
//       path: "/admin/create-posts"
//     },
//             {
//       title: "Hero Slides",
//       icon: <Sliders size={20} />,
//       path: "/admin/admin-hero"
//     },
//     {
//       title: "Messages",
//       icon: <MessagesSquare size={20} />,
//       path: "/admin/admin-messages"
//     },
//     {
//       title: "Advertise Inquiry",
//       icon: <AlignEndVertical size={20} />,
//       path: "/admin/admin-advertise"
//     },
//     // {
//     //   title: "Refund Requests",
//     //   icon: <DollarSignIcon size={20} />,
//     //   path: "/admin/refund"
//     // },
//     //     {
//     //   title: "Certificate Requests",
//     //   icon: <Award size={20} />,
//     //   path: "/admin/certificaterequests"
//     // },
//     // {
//     //   title: "Upload Notes",
//     //   icon: <Pencil size={20} />,
//     //   path: "/admin/notes"
//     // },
//   ]

//   // ================= LOGOUT (fully functional) =================
//   const logoutHandler = () => {
//     // Clear local storage
//     localStorage.clear();
//     // Clear global user state
//     setUser(null);
//     // Navigate and reload to reset application state
//     navigate("/login", { replace: true });
//     window.location.reload();
//   };

//   return (
//       <>
//         {/* ================= SIDEBAR ================= */}
//         <aside
//           style={{
//             top: NAVBAR_HEIGHT,
//             height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
//           }}
//           className={`
//             fixed left-0
//             mt-24
//             text-gray-900
//             border-r border-gray-200
//             flex flex-col
//             transition-all duration-300 ease-in-out
//             bg-white
//             ${collapsed ? "w-[80px]" : "w-[280px]"}
//           `}
//         >
//           {/* ================= HEADER ================= */}
//           <div
//             className={`
//               flex items-center
//               px-4 py-5
//               border-b border-gray-200
//               ${collapsed ? "justify-center" : "justify-between"}
//             `}
//           >
//             <div className="flex items-center gap-3">
//               <div className="bg-black text-white p-2 rounded-full">
//                 <Feather size={20} />
//               </div>
  
//               {!collapsed && (
//                 <div>
//                   <h1 className="font-bold text-sm text-gray-900">Admin Panel</h1>
//                   {/* <p className="text-xs text-gray-500">LMS Dashboard</p> */}
//                 </div>
//               )}
//             </div>
  
//             {!collapsed && (
//               <button
//                 onClick={() => setCollapsed(true)}
//                 className="text-gray-400 hover:text-gray-700 transition-colors"
//                 aria-label="Collapse sidebar"
//               >
//                 <ChevronLeft size={18} />
//               </button>
//             )}
  
//             {collapsed && (
//               <button
//                 onClick={() => setCollapsed(false)}
//                 className="absolute -right-3 top-6 bg-black text-white rounded-full p-1 hover:bg-gray-800 transition-colors"
//                 aria-label="Expand sidebar"
//               >
//                 <ChevronRight size={16} />
//               </button>
//             )}
//           </div>
  
//           {/* ================= MENU ================= */}
//           <div
//             className={`
//               flex-1 px-3 py-4 space-y-1
//               ${collapsed ? "overflow-hidden" : "overflow-y-auto"}
//             `}
//           >
//             {menuItems.map((item) => (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 className={({ isActive }) => `
//                   flex items-center
//                   ${collapsed ? "justify-center" : "justify-start"}
//                   gap-3
//                   px-4 py-3
//                   rounded-xl
//                   transition-all duration-200
//                   ${isActive
//                     ? "bg-gray-100 text-black"
//                     : "text-gray-700 hover:bg-gray-50 hover:text-black"
//                   }
//                   ${collapsed ? "relative group" : ""}
//                 `}
//               >
//                 <span className="flex-shrink-0">{item.icon}</span>
  
//                 {!collapsed && (
//                   <span className="text-sm font-medium">{item.title}</span>
//                 )}
  
//                 {/* Tooltip for collapsed state */}
//                 {collapsed && (
//                   <span className="
//                     absolute left-full ml-4 px-3 py-1.5
//                     bg-gray-900 text-white text-xs font-medium
//                     rounded-lg shadow-lg
//                     opacity-0 group-hover:opacity-100
//                     transition-opacity duration-200
//                     whitespace-nowrap
//                     pointer-events-none
//                     z-50
//                   ">
//                     {item.title}
//                   </span>
//                 )}
//               </NavLink>
//             ))}
//           </div>
  
//           {/* ================= FOOTER ================= */}
//           <div className="border-t border-gray-200 p-3">
//             <button
//               onClick={logoutHandler}
//               className={`
//                 w-full flex items-center
//                 ${collapsed ? "justify-center" : "justify-start"}
//                 gap-3
//                 px-4 py-3
//                 rounded-xl
//                 text-red-600 hover:text-red-700
//                 hover:bg-red-50
//                 transition-all duration-200
//                 ${collapsed ? "relative group" : ""}
//               `}
//             >
//               <LogOut size={20} />
  
//               {!collapsed && <span className="text-sm font-medium">Logout</span>}
  
//               {/* Tooltip for collapsed state */}
//               {collapsed && (
//                 <span className="
//                   absolute left-full ml-4 px-3 py-1.5
//                   bg-gray-900 text-white text-xs font-medium
//                   rounded-lg shadow-lg
//                   opacity-0 group-hover:opacity-100
//                   transition-opacity duration-200
//                   whitespace-nowrap
//                   pointer-events-none
//                   z-50
//                 ">
//                   Logout
//                 </span>
//               )}
//             </button>
//           </div>
//         </aside>
  
//         {/* ================= CONTENT SPACER ================= */}
//         <div
//           className={`
//             transition-all duration-300
//             ${collapsed ? "w-[80px]" : "w-[280px]"}
//           `}
//         />
//       </>
//     );
// };

// export default AdminSidebar;



import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Feather,
  Sliders,
  Users,
  MousePointerSquareDashed,
  MessagesSquare,
  AlignEndVertical,
} from "lucide-react";

// Import user context to clear state on logout
import { getData } from "@/context/userContext";

const NAVBAR_HEIGHT = 64;
const DESKTOP_BREAKPOINT = 1024; // px, matches Tailwind's `lg`

const menuItems = [
  { title: "Users", icon: <Users size={20} />, path: "/admin/dashboard" },
  { title: "Create Posts", icon: <MousePointerSquareDashed size={20} />, path: "/admin/create-posts" },
  { title: "Hero Slides", icon: <Sliders size={20} />, path: "/admin/admin-hero" },
  { title: "Messages", icon: <MessagesSquare size={20} />, path: "/admin/admin-messages" },
  { title: "Advertise Inquiry", icon: <AlignEndVertical size={20} />, path: "/admin/admin-advertise" },
];

// ───────────────────────────────────────────────────────
// Small presentational components
// ───────────────────────────────────────────────────────

const MobileTopBar = ({ onOpen }) => (
  <div
    style={{ top: NAVBAR_HEIGHT }}
    className="lg:hidden fixed left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200"
  >
    <button
      onClick={onOpen}
      aria-label="Open menu"
      className="p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100"
    >
      <Menu size={22} />
    </button>
    <div className="flex items-center gap-2">
      <div className="bg-black text-white p-1.5 rounded-full">
        <Feather size={16} />
      </div>
      <h1 className="font-bold text-sm text-gray-900">Admin Panel</h1>
    </div>
  </div>
);

const Backdrop = ({ onClick }) => (
  <div
    onClick={onClick}
    aria-hidden="true"
    style={{ top: NAVBAR_HEIGHT }}
    className="lg:hidden fixed inset-x-0 bottom-0 bg-black/50 z-30 transition-opacity duration-200"
  />
);

const SidebarHeader = ({ collapsed, isMobile, onCollapse, onExpand, onCloseMobile }) => (
  <div
    className={`
      flex items-center
      px-4 py-5
      border-b border-gray-200
      ${collapsed && !isMobile ? "justify-center" : "justify-between"}
    `}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="bg-black text-white p-2 rounded-full shrink-0">
        <Feather size={20} />
      </div>
      {(!collapsed || isMobile) && (
        <h1 className="font-bold text-sm text-gray-900 truncate">Admin Panel</h1>
      )}
    </div>

    {/* Mobile: close (X) button */}
    {isMobile && (
      <button
        onClick={onCloseMobile}
        className="text-gray-400 hover:text-gray-700 shrink-0"
        aria-label="Close sidebar"
      >
        <X size={20} />
      </button>
    )}

    {/* Desktop: collapse button (only when expanded) */}
    {!isMobile && !collapsed && (
      <button
        onClick={onCollapse}
        className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft size={18} />
      </button>
    )}

    {/* Desktop: expand button (only when collapsed) */}
    {!isMobile && collapsed && (
      <button
        onClick={onExpand}
        className="absolute -right-3 top-6 bg-black text-white rounded-full p-1 hover:bg-gray-800 transition-colors"
        aria-label="Expand sidebar"
      >
        <ChevronRight size={16} />
      </button>
    )}
  </div>
);

const SidebarLink = ({ item, collapsed, isMobile, onNavigate }) => {
  const showLabel = !collapsed || isMobile;
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) => `
        flex items-center
        ${showLabel ? "justify-start" : "justify-center"}
        gap-3
        px-4 py-3
        rounded-xl
        transition-all duration-200
        ${isActive ? "bg-gray-100 text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}
        ${!showLabel ? "relative group" : ""}
      `}
    >
      <span className="flex-shrink-0">{item.icon}</span>

      {showLabel && <span className="text-sm font-medium truncate">{item.title}</span>}

      {!showLabel && (
        <span
          className="
            absolute left-full ml-4 px-3 py-1.5
            bg-gray-900 text-white text-xs font-medium
            rounded-lg shadow-lg
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            whitespace-nowrap
            pointer-events-none
            z-50
          "
        >
          {item.title}
        </span>
      )}
    </NavLink>
  );
};

const SidebarMenu = ({ collapsed, isMobile, onNavigate }) => (
  <div className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto`}>
    {menuItems.map((item) => (
      <SidebarLink key={item.path} item={item} collapsed={collapsed} isMobile={isMobile} onNavigate={onNavigate} />
    ))}
  </div>
);

const SidebarFooter = ({ collapsed, isMobile, onLogout }) => {
  const showLabel = !collapsed || isMobile;
  return (
    <div className="border-t border-gray-200 p-3">
      <button
        onClick={onLogout}
        className={`
          w-full flex items-center
          ${showLabel ? "justify-start" : "justify-center"}
          gap-3
          px-4 py-3
          rounded-xl
          text-red-600 hover:text-red-700
          hover:bg-red-50
          transition-all duration-200
          ${!showLabel ? "relative group" : ""}
        `}
      >
        <LogOut size={20} />
        {showLabel && <span className="text-sm font-medium">Logout</span>}

        {!showLabel && (
          <span
            className="
              absolute left-full ml-4 px-3 py-1.5
              bg-gray-900 text-white text-xs font-medium
              rounded-lg shadow-lg
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              whitespace-nowrap
              pointer-events-none
              z-50
            "
          >
            Logout
          </span>
        )}
      </button>
    </div>
  );
};

// ───────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { setUser } = getData();

  const [collapsed, setCollapsed] = useState(false); // desktop icon-only collapse
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // mobile off-canvas drawer

  // ================= RESPONSIVE =================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < DESKTOP_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(false); // full labels inside the drawer, drawer itself is hidden/shown instead
        setMobileOpen(false); // start closed on mobile
      } else {
        setMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll while the mobile drawer is open
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

  // ================= LOGOUT =================
  const logoutHandler = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true });
    window.location.reload();
  };

  const sidebarWidth = isMobile ? 280 : collapsed ? 80 : 280;

  return (
    <>
      {isMobile && <MobileTopBar onOpen={() => setMobileOpen(true)} />}
      {isMobile && mobileOpen && <Backdrop onClick={() => setMobileOpen(false)} />}

      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          top: NAVBAR_HEIGHT,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          width: sidebarWidth,
        }}
        className={`
          fixed left-0 z-40
          text-gray-900
          border-r border-gray-200
          flex flex-col
          bg-white
          transition-transform duration-300 ease-in-out
          ${isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          ${!isMobile ? "transition-[width] duration-300 ease-in-out" : ""}
        `}
      >
        <SidebarHeader
          collapsed={collapsed}
          isMobile={isMobile}
          onCollapse={() => setCollapsed(true)}
          onExpand={() => setCollapsed(false)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <SidebarMenu
          collapsed={collapsed}
          isMobile={isMobile}
          onNavigate={() => isMobile && setMobileOpen(false)}
        />

        <SidebarFooter collapsed={collapsed} isMobile={isMobile} onLogout={logoutHandler} />
      </aside>

      {/* ================= CONTENT SPACER ================= */}
      {/* On mobile the sidebar is an overlay (no spacer), but we reserve room for the fixed top bar. */}
      <div
        style={!isMobile ? undefined : { height: 56 }}
        className={`transition-all duration-300 ${isMobile ? "w-0" : collapsed ? "w-[80px]" : "w-[280px]"}`}
      />
    </>
  );
};

export default AdminSidebar;
