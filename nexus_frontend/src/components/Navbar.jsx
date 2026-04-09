import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "../context/AuthContext";

const primaryLinks = [
  { label: "Module A", to: "/resources", auth: true },
  { label: "Bookings", to: "/bookings", auth: true },
  { label: "Ticketing", to: "/tickets", auth: true },
  { label: "Admin", to: "/admin/dashboard", auth: true, adminOnly: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");

  const visibleLinks = primaryLinks.filter((link) => {
    if (link.auth && !user) {
      return false;
    }

    if (link.adminOnly && !isAdmin) {
      return false;
    }

    return true;
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsOpen(false);
  };

  const desktopLinkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-semibold transition ${
      isActive ? "text-white" : "text-[#d8ece5] hover:text-white"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive ? "bg-white text-[#062321]" : "text-[#d8ece5] hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto max-w-6xl rounded-[1.6rem] border border-white/10 bg-[rgba(3,27,26,0.92)] shadow-[0_20px_60px_rgba(3,27,26,0.35)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(180deg,#8fd0bc_0%,#c7ede1_100%)] text-sm font-black uppercase tracking-[0.2em] text-[#062321] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
              NX
            </div>
            <div className="min-w-0">
              <p className="font-display truncate text-2xl font-extrabold tracking-[-0.04em] text-white">
                sliit nexus
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-5 lg:flex">
            {visibleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {user && <NotificationPanel />}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#062321] transition hover:bg-[#e7f3ee]"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#062321] transition hover:bg-[#e7f3ee]"
              >
                Sign In
              </Link>
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
          <div className="border-t border-white/10 px-4 pb-4 pt-3 lg:hidden">
            <div className="grid gap-2">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={mobileLinkClass}
                >
                  {link.label}
                </NavLink>
              ))}

              {user ? (
                <>
                  <div className="pt-2">{user && <NotificationPanel />}</div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#062321]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-[#062321]"
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
