import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sliitCampusImage from "../assets/SLIIT-malabe.jpg";
import sliitBuildingImage from "../assets/download.webp";
import sliitLibraryImage from "../assets/SLIIT-Library-3.jpg";

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

const heroSlides = [
  {
    image: sliitCampusImage,
    alt: "SLIIT Malabe campus aerial view",
    eyebrow: "Welcome to SLIIT Nexus",
  },
  {
    image: sliitBuildingImage,
    alt: "SLIIT academic building entrance",
    eyebrow: "Explore campus spaces",
  },
  {
    image: sliitLibraryImage,
    alt: "SLIIT library learning area",
    eyebrow: "Connected student services",
  },
];

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="pt-24 bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.alt}
              src={slide.image}
              alt={slide.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.88)_0%,rgba(15,23,42,0.72)_38%,rgba(15,23,42,0.26)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,64,175,0.08)_0%,rgba(15,23,42,0.48)_100%)]" />

          <div className="relative grid min-h-[34rem] items-end gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
            <div className="max-w-3xl self-center">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                {heroSlides[activeSlide].eyebrow}
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                Smart Campus Operations, Unified in One Platform
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
                SLIIT Nexus helps students, staff, and administrators manage bookings, resources, and support
                workflows with speed and clarity across the Malabe campus.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/bookings"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Start Booking
                </Link>
                <Link
                  to="/tickets"
                  className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Submit Ticket
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.alt}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeSlide ? "w-10 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
                    }`}
                    aria-label={`Show hero slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/15 bg-white/12 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
              <ul className="mt-5 space-y-3">
                {quickActions.map((action) => (
                  <li
                    key={action}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-slate-100"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
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
