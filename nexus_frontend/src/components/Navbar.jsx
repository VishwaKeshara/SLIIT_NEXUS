import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "../context/AuthContext";

const primaryLinks = [
  { label: "Overview", to: "/" },
  { label: "Bookings", to: "/bookings", auth: true },
  { label: "Support Desk", to: "/tickets", auth: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, unreadCount, logout } = useAuth();
  const navigate = useNavigate();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");
  const roleLabel = isAdmin ? "Admin" : roles.includes("TECHNICIAN") ? "Technician" : "User";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-slate-900 text-white shadow-lg shadow-slate-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <nav className="fixed z-50 w-full bg-slate-50/92 px-3 pt-3 backdrop-blur">
      <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] text-sm font-black tracking-[0.25em] text-white">
                NX
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-slate-950">SLIIT Nexus</p>
                <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Smart Campus Command Center
                </p>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                Campus Systems Online
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {primaryLinks
              .filter((item) => !item.auth || user)
              .map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            {isAdmin && (
              <NavLink to="/admin/dashboard" className={navLinkClass}>
                Admin Console
              </NavLink>
            )}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {user && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  {roleLabel}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {user.displayName}
                </span>
              </div>
            )}

            <NotificationPanel />

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-[linear-gradient(135deg,#2563eb,#0f172a)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Close" : "Menu"}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-slate-200 px-4 pb-4 pt-4 lg:hidden">
            <div className="grid gap-3">
              <div className="rounded-3xl bg-[linear-gradient(135deg,#eff6ff,#f8fafc_55%,#e2e8f0)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Session
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {user ? user.displayName : "Guest Access"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {user ? user.email : "Sign in to manage bookings and support tickets"}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
                    {user ? roleLabel : "Visitor"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                    {user ? `${unreadCount} unread alerts` : "Notifications available after login"}
                  </div>
                  <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                    Campus systems online
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                {primaryLinks
                  .filter((item) => !item.auth || user)
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `rounded-2xl px-4 py-3 text-sm font-semibold ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}

                {isAdmin && (
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 text-sm font-semibold ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    Admin Console
                  </NavLink>
                )}
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0f172a)] py-3 text-center text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
