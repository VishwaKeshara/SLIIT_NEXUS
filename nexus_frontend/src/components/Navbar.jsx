import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "../context/AuthContext";

const primaryLinks = [
  { label: "Resources", to: "/resources", auth: true },
  { label: "My Bookings", to: "/bookings", auth: true },
  { label: "Incidents", to: "/incidents", auth: true },
  { label: "Notifications", to: "/notifications", auth: true },
  { label: "About Us", to: "/about-us", auth: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, unreadCount, logout } = useAuth();
  const navigate = useNavigate();
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");
  const roleLabel = isAdmin ? "Admin" : roles.includes("TECHNICIAN") ? "Technician" : "User";
  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "GU";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
        : "text-slate-600 hover:bg-white hover:text-slate-950"
    }`;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3 rounded-[1.5rem] px-1 py-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(145deg,#020617,#1d4ed8_72%,#60a5fa)] text-sm font-black tracking-[0.25em] text-white shadow-[0_12px_28px_rgba(29,78,216,0.35)]">
                NX
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-slate-950">SLIIT Nexus</p>
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Smart Campus Command Center
                </p>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Campus Systems Online
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 p-1.5 lg:flex">
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

          <div className="hidden items-center gap-2 lg:flex">
            {user && (
              <Link
                to="/profile"
                className="flex max-w-[19rem] items-center gap-3 rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(135deg,#f8fbff,#ffffff_58%,#f1f5f9)] px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] text-sm font-black uppercase tracking-[0.08em] text-white">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{user.displayName}</p>
                    <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 ring-1 ring-blue-100">
                      {roleLabel}
                    </span>
                  </div>
                  <p className="truncate text-xs font-medium text-slate-500">{user.email}</p>
                </div>
              </Link>
            )}

            <NotificationPanel />

            {user ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="rounded-full bg-[linear-gradient(135deg,#2563eb,#0f172a)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Close" : "Menu"}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-slate-200/80 bg-slate-50/70 px-4 pb-4 pt-4 lg:hidden">
            <div className="grid gap-3">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(135deg,#eff6ff,#f8fafc_55%,#e2e8f0)] p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Session
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {user ? user.displayName : "Guest Access"}
                    </p>
                    <p className="truncate text-sm text-slate-600">
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

              <div className="grid gap-2 rounded-[1.5rem] border border-slate-200/80 bg-white p-2 shadow-sm">
                {primaryLinks
                  .filter((item) => !item.auth || user)
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `rounded-[1rem] px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                            : "text-slate-700 hover:bg-slate-100"
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
                      `rounded-[1rem] px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                          : "text-slate-700 hover:bg-slate-100"
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
                  className="w-full rounded-[1rem] bg-slate-900 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
                >
                  Sign Out
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-[1rem] border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-[1rem] bg-[linear-gradient(135deg,#2563eb,#0f172a)] py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)]"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
