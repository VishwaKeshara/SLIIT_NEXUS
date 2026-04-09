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
            A modern campus operations platform for resource management, booking workflows, and maintenance incident
            handling.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/bookings">Bookings</Link></li>
            <li><Link to="/tickets">Tickets</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-extrabold text-white">Contact</h3>
          <div className="space-y-3 text-base text-[#d6ebe3]">
            <p>Email: support@sliitnexus.com</p>
            <p>Location: SLIIT, Malabe, Sri Lanka</p>
            <p>System Type: React Client + Spring Boot REST API</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1f3d39] py-4 text-center text-sm text-[#9fcdbb]">
        © 2026 SLIIT NEXUS. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
