// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import AdminSidebar from './AdminSidebar';

// const AdminLayout = () => {
//   return (
//     <div className="flex min-h-screen border-t-2 bg-gray-50">
//       <AdminSidebar />
//       <main className="flex-1 overflow-y-auto">
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// export default AdminLayout;






import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { pathname } = useLocation();

  // ─── Scroll the content area back to top on every navigation ──
  // Without this, switching admin pages keeps the previous page's
  // scroll position, which feels broken on long tables/forms.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen border-t-2 border-gray-200 bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {/* ─── Content wrapper ─────────────────────────────
            Responsive padding that scales up with viewport size,
            plus extra bottom padding on mobile so content never
            sits underneath the floating menu button. ── */}
        <div className="px-3 py-4 pb-24 xs:px-4 sm:px-6 sm:py-6 sm:pb-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto w-full transition-[padding] duration-300 ease-in-out">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
