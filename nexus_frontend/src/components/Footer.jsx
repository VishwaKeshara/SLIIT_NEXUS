import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-lg font-bold text-blue-400">SLIIT NEXUS</h2>
          <p className="text-gray-400 mt-3 text-sm">
            Smart Campus Operations Hub to manage resources, bookings,
            and maintenance efficiently.
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
          <h3 className="font-semibold mb-3">Contact</h3>
          <p className="text-gray-400 text-sm">Email: support@sliitnexus.com</p>
          <p className="text-gray-400 text-sm mt-2">SLIIT, Malabe, Sri Lanka</p>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm py-4 border-t border-gray-700">
        &copy; 2026 SLIIT NEXUS. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
