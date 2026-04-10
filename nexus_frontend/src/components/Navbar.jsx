import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "../context/useAuth";
import { authApi } from "../services/api";

const primaryLinks = [
  { label: "Resources", to: "/availability" },
  { label: "Booking", to: "/bookings" },
  { label: "Ticketing", to: "/tickets" },
  { label: "About Us", to: "/about-us", public: true },
  { label: "Contact Us", to: "/contact-us", public: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");
  const dashboardPath = isAdmin ? "/admin/dashboard" : "/bookings";

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsOpen(false);
  };

  const desktopLinkClass = (isActive = false) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      isActive
        ? "bg-white text-[#062321]"
        : "text-[#d8ece5] hover:bg-white/10 hover:text-white"
    }`;

  const mobileLinkClass = (isActive = false) =>
    `rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive ? "bg-white text-[#062321]" : "text-[#d8ece5] hover:bg-white/10 hover:text-white"
    }`;

  const renderDesktopLink = (link) =>
    user || link.public ? (
      <NavLink key={link.to} to={link.to} className={({ isActive }) => desktopLinkClass(isActive)}>
        {link.label}
      </NavLink>
    ) : (
      <Link key={link.to} to="/login" state={{ from: link.to }} className={desktopLinkClass(false)}>
        {link.label}
      </Link>
    );

  const renderMobileLink = (link) =>
    user || link.public ? (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={() => setIsOpen(false)}
        className={({ isActive }) => mobileLinkClass(isActive)}
      >
        {link.label}
      </NavLink>
    ) : (
      <Link
        key={link.to}
        to="/login"
        state={{ from: link.to }}
        onClick={() => setIsOpen(false)}
        className={mobileLinkClass(false)}
      >
        {link.label}
      </Link>
    );

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="w-full border-b border-white/10 bg-[rgba(3,27,26,0.95)] shadow-[0_16px_40px_rgba(3,27,26,0.22)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-5 px-5 py-3 sm:px-8 lg:px-10">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(180deg,#8fd0bc_0%,#c7ede1_100%)] text-sm font-black uppercase tracking-[0.2em] text-[#062321] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
              NX
            </div>
            <div className="min-w-0">
              <p className="font-display truncate text-xl font-extrabold text-white">SLIIT NEXUS</p>
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#bfe8db]">
                Smart Campus Operations Hub
              </p>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-2 xl:flex">
            {primaryLinks.map((link) => renderDesktopLink(link))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {user && (
              <div className="flex items-center gap-3">
                <NotificationPanel />
                <Link to="/profile" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f8a74] font-bold text-white">
                    {user.displayName
                      ?.split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {user.displayName}
                  </span>
                </Link>
              </div>
            )}

            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/16"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#062321] transition hover:bg-[#e7f3ee]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href={authApi.googleLoginUrl}
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/16"
                >
                  Google Sign In
                </a>
                <Link
                  to="/login"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#062321] transition hover:bg-[#e7f3ee]"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white lg:hidden"
          >
            {isOpen ? "Close" : "Menu"}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-white/10 px-5 pb-4 pt-3 lg:hidden">
            <div className="grid gap-2">
              {primaryLinks.map((link) => renderMobileLink(link))}

              {user ? (
                <>
                  <div className="pt-2">{user && <NotificationPanel />}</div>
                  <Link
                    to={dashboardPath}
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#062321]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={authApi.googleLoginUrl}
                    className="mt-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white"
                  >
                    Google Sign In
                  </a>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-[#062321]"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
