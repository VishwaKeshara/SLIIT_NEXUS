import { Link, NavLink } from "react-router-dom";

const ResourceNavLink = ({ children, end = false, fillClass, to }) => (
  <NavLink
    end={end}
    to={to}
    className={({ isActive }) =>
      `group relative overflow-hidden rounded-lg border border-white/14 bg-white/10 px-5 py-4 text-left font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:border-white/35 hover:text-white hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)] ${
        isActive ? "text-white" : "text-white"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={`absolute inset-y-0 left-0 ${isActive ? "w-full" : "w-0"} ${fillClass} transition-all duration-500 ease-out group-hover:w-full`}
        />
        <span className="relative z-10">{children}</span>
      </>
    )}
  </NavLink>
);

const SidebarAction = ({ children, fillClass, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative overflow-hidden rounded-lg border border-white/14 bg-white/10 px-5 py-4 text-left font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:border-white/35 hover:text-white hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)]"
  >
    <span className={`absolute inset-y-0 left-0 w-0 ${fillClass} transition-all duration-500 ease-out group-hover:w-full`} />
    <span className="relative z-10">{children}</span>
  </button>
);

const ResourcesSidebar = ({ isAdmin, onLogout, showDashboardBackLink = false }) => {
  return (
    <aside className="sticky top-6 overflow-hidden rounded-lg bg-[linear-gradient(160deg,#021A54_0%,#355f8a_48%,#6494a4_100%)] p-6 text-white shadow-[0_28px_80px_rgba(2,26,84,0.38)] ring-1 ring-[#FFF6F6]/25 lg:min-h-[calc(100vh-3rem)] lg:w-80 lg:shrink-0">
      <div className="flex items-center gap-4 border-b border-white/15 pb-7">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#FFF6F6,#d8e8ee)] text-2xl font-black tracking-[0.12em] text-[#021A54] shadow-[0_14px_32px_rgba(2,26,84,0.24)]">
          NX
        </div>
        <div>
          <p className="font-display text-3xl font-extrabold">SLIIT Nexus</p>
          <p className="text-base font-medium tracking-[0.08em] text-[#d5efe6]">Resources</p>
        </div>
      </div>

      <nav className="mt-7 grid gap-4 text-base font-extrabold">
        {isAdmin && (
          <ResourceNavLink to="/resources/dashboard" fillClass="bg-[linear-gradient(90deg,#021A54,#6494a4)]">
            Dashboard
          </ResourceNavLink>
        )}
        {isAdmin && (
          <ResourceNavLink end to="/resources" fillClass="bg-[linear-gradient(90deg,#355f8a,#8897BD)]">
            Resources
          </ResourceNavLink>
        )}
        {isAdmin && (
          <ResourceNavLink to="/resources/add" fillClass="bg-[linear-gradient(90deg,#021A54,#8897BD)]">
            Add Resource
          </ResourceNavLink>
        )}
        {isAdmin && (
          <ResourceNavLink to="/resources/bulk-import" fillClass="bg-[linear-gradient(90deg,#355f8a,#6494a4)]">
            Bulk Import
          </ResourceNavLink>
        )}
        <ResourceNavLink to="/availability" fillClass="bg-[linear-gradient(90deg,#021A54,#6494a4)]">
          Availability
        </ResourceNavLink>
        <SidebarAction onClick={onLogout} fillClass="bg-[linear-gradient(90deg,#021A54,#6494a4)]">
          Logout
        </SidebarAction>
      </nav>

      <div className="mt-8 rounded-lg border border-[#FFF6F6]/20 bg-[#FFF6F6]/10 p-5 shadow-[inset_0_1px_0_rgba(255,246,246,0.14)] backdrop-blur">
        <p className="font-display text-2xl font-extrabold">
          {isAdmin ? "Resource Flow" : "Availability"}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#d7eee6]">
          {isAdmin
            ? "Manage resources, imports, and availability through focused pages."
            : "Check available resources and continue to booking."}
        </p>
      </div>

      {showDashboardBackLink && (
        <Link
          to="/profile"
          className="group relative mt-6 flex overflow-hidden rounded-lg border border-white/14 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:text-white"
        >
          <span className="absolute inset-y-0 left-0 w-0 bg-[linear-gradient(90deg,#021A54,#6494a4)] transition-all duration-500 ease-out group-hover:w-full" />
          <span className="relative z-10 w-full">Back to Dashboard</span>
        </Link>
      )}
    </aside>
  );
};

export default ResourcesSidebar;
