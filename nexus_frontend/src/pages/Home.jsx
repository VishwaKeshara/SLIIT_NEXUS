import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookingApi, resourceApi, ticketApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [r, b, t] = await Promise.all([resourceApi.list(), bookingApi.list(), ticketApi.list()]);
        setResources(r.data ?? []);
        setBookings(b.data ?? []);
        setTickets(t.data ?? []);
      } catch {
        setResources([]);
        setBookings([]);
        setTickets([]);
      }
    };
    load();
  }, [user]);

  const approvedBookings = useMemo(() => bookings.filter((b) => b.status === "APPROVED").length, [bookings]);
  const openTickets = useMemo(
    () => tickets.filter((t) => !["CLOSED", "RESOLVED", "REJECTED"].includes(t.status)).length,
    [tickets]
  );
  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === "PENDING").length, [bookings]);

  return (
    <main
      className="relative min-h-screen bg-cover bg-center bg-no-repeat pt-20"
      style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
    >
      <div className="absolute inset-0 bg-[#031B1A]/55" />

      <section className="relative z-10 px-4 py-14 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="font-display text-6xl font-extrabold md:text-7xl">sliit nexus</h1>
          <p className="mt-3 text-xl text-[#d8f2e8]">Seamless facility booking and maintenance operations.</p>

          <div className="mx-auto mt-7 flex max-w-3xl items-center rounded-full border border-[#bde5d7]/70 bg-white p-2 shadow-[0_12px_30px_rgba(3,27,26,0.35)]">
            <input
              type="text"
              placeholder="Search resources, bookings, or tickets..."
              className="w-full rounded-full px-4 py-2 text-base text-[#031B1A] outline-none"
            />
            <button className="rounded-full bg-[#2E7D69] px-5 py-2 text-base font-bold text-white hover:bg-[#0E3B34]">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-8">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#9dd6c4] bg-[#ddf3ea] p-5 shadow-sm">
            <h3 className="font-display text-3xl font-extrabold text-[#031B1A]">Facilities Catalogue</h3>
            <p className="mt-4 text-xl font-bold text-[#0E3B34]">Explore Catalogue</p>
            <Link
              to="/resources"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#2E7D69] px-4 py-2.5 text-base font-bold text-white hover:bg-[#0E3B34]"
            >
              View Catalogue
            </Link>
          </article>

          <article className="rounded-2xl border border-[#9dd6c4] bg-[#ddf3ea] p-5 shadow-sm">
            <h3 className="font-display text-3xl font-extrabold text-[#031B1A]">Make a Booking</h3>
            <p className="mt-4 text-xl font-bold text-[#0E3B34]">New Booking Request</p>
            <Link
              to="/bookings"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#2E7D69] px-4 py-2.5 text-base font-bold text-white hover:bg-[#0E3B34]"
            >
              Book Now
            </Link>
          </article>

          <article className="rounded-2xl border border-[#9dd6c4] bg-[#ddf3ea] p-5 shadow-sm">
            <h3 className="font-display text-3xl font-extrabold text-[#031B1A]">Report an Issue</h3>
            <p className="mt-4 text-xl font-bold text-[#0E3B34]">Log an Incident</p>
            <Link
              to="/tickets"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#2E7D69] px-4 py-2.5 text-base font-bold text-white hover:bg-[#0E3B34]"
            >
              Report Issue
            </Link>
          </article>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-14">
        <h2 className="font-display text-4xl font-extrabold text-white">Your Dashboard</h2>
        <div className="mt-4 rounded-2xl border border-[#9dd6c4] bg-[#ecf8f3] p-5">
          <h3 className="text-2xl font-extrabold text-[#0E3B34]">Take Action</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm font-bold text-[#2E7D69]">Total Resources</p>
              <p className="font-display mt-2 text-4xl font-extrabold text-[#031B1A]">{user ? resources.length : "-"}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm font-bold text-[#2E7D69]">Approved Bookings</p>
              <p className="font-display mt-2 text-4xl font-extrabold text-[#031B1A]">{user ? approvedBookings : "-"}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm font-bold text-[#2E7D69]">Open Tickets</p>
              <p className="font-display mt-2 text-4xl font-extrabold text-[#031B1A]">{user ? openTickets : "-"}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm font-bold text-[#2E7D69]">Pending Bookings</p>
              <p className="font-display mt-2 text-4xl font-extrabold text-[#031B1A]">{user ? pendingBookings : "-"}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
