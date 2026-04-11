import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-[#1b4a42] bg-[linear-gradient(180deg,#031B1A_0%,#0E3B34_100%)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2E7D69,#BFE8D9)] text-sm font-black tracking-[0.2em] text-[#031B1A]">
              NX
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">SLIIT NEXUS</h2>
              <p className="text-base font-semibold text-[#BFE8D9]">Smart Campus Operations Hub</p>
            </div>
          </div>

          <p className="mt-4 max-w-sm text-base leading-7 text-[#d6ebe3]">
            A modern campus operations platform for resource management, booking workflows, maintenance response, and
            campus-wide notifications.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-white">Help / Contact</h3>
          <ul className="space-y-2 text-sm text-[#d6ebe3]">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a href="mailto:support@sliitnexus.com">Campus support</a>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/notifications">Help Centre</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-extrabold text-white">Terms / Privacy</h3>
          <div className="space-y-3 text-base text-[#d6ebe3]">
            <p>Campus support: support@sliitnexus.com</p>
            <p>Location: SLIIT, Malabe, Sri Lanka</p>
            <p>Use of this platform follows institutional terms, privacy rules, and ICT service policies.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1f3d39] py-4 text-center text-sm text-[#9fcdbb]">
        Copyright 2026 SLIIT NEXUS. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
