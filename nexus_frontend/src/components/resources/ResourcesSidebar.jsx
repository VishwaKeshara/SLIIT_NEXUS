import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
    isActive ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
  }`;

const ResourcesSidebar = ({ isAdmin, onLogout }) => {
  return (
    <aside className="sticky top-6 rounded-[1.8rem] bg-[#103c35] p-6 text-white shadow-[0_28px_80px_rgba(16,60,53,0.28)] lg:min-h-[calc(100vh-3rem)] lg:w-80 lg:shrink-0">
      <div className="flex items-center gap-4 border-b border-white/15 pb-7">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[#f2d45c] text-2xl font-black tracking-[0.12em] text-[#103c35]">
          NX
        </div>
        <div>
          <p className="font-display text-3xl font-extrabold tracking-[-0.06em]">SLIIT Nexus</p>
          <p className="text-base font-medium tracking-[0.08em] text-[#d5efe6]">Resources</p>
        </div>
      </div>

      <nav className="mt-7 grid gap-4 text-base font-extrabold">
        <NavLink to="/resources/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink end to="/resources" className={linkClass}>
          Resources
        </NavLink>
        {isAdmin && (
          <NavLink to="/resources/add" className={linkClass}>
            Add Resource
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/resources/bulk-import" className={linkClass}>
            Bulk Import
          </NavLink>
        )}
        <NavLink to="/resources/availability" className={linkClass}>
          Availability
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 rounded-[1.15rem] bg-[#f2d45c] px-5 py-4 text-left text-base font-black text-[#103c35] transition hover:bg-[#f7df76]"
        >
          Logout
        </button>
      </nav>

      <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
        <p className="font-display text-2xl font-extrabold tracking-[-0.04em]">Resource Flow</p>
        <p className="mt-3 text-sm leading-6 text-[#d7eee6]">
          Manage resources, imports, and availability through focused pages.
        </p>
      </div>
    </aside>
  );
};

export default ResourcesSidebar;
