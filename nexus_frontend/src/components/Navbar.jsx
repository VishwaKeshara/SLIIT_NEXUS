import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "../context/AuthContext";

const primaryLinks = [
  { label: "Catalogue", to: "/resources", auth: true },
  { label: "Bookings", to: "/bookings", auth: true },
  { label: "Ticketing", to: "/tickets", auth: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[#1f4e44] bg-[linear-gradient(90deg,#031B1A_0%,#0E3B34_48%,#031B1A_100%)] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2E7D69,#BFE8D9)] text-sm font-black tracking-[0.22em] text-[#031B1A]">
            NX
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold leading-none">sliit nexus</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {primaryLinks
            .filter((item) => !item.auth || user)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-base font-semibold transition ${
                    isActive ? "bg-[#2E7D69] text-white" : "text-[#d7f3e8] hover:bg-[#1c5a4e]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          {isAdmin && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-base font-semibold transition ${
                  isActive ? "bg-[#2E7D69] text-white" : "text-[#d7f3e8] hover:bg-[#1c5a4e]"
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user && <NotificationPanel />}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#031B1A] hover:bg-[#dff4eb]"
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="rounded-full bg-[#2E7D69] px-5 py-2 text-sm font-bold text-white">
              Sign In
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl border border-[#4f8f7f] px-3 py-2 text-sm lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen && (
        <div className="mx-auto grid max-w-7xl gap-2 px-4 pb-3 lg:hidden">
          {primaryLinks
            .filter((item) => !item.auth || user)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-semibold ${
                    isActive ? "bg-[#2E7D69] text-white" : "bg-[#114238] text-[#d7f3e8]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          {user ? (
            <button type="button" onClick={handleLogout} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#031B1A]">
              Sign Out
            </button>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="rounded-xl bg-[#2E7D69] px-4 py-2 text-sm font-bold text-white">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
