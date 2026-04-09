import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingApi, resourceApi, ticketApi } from "../services/api";

const actionCards = [
  {
    title: "Facilities Catalogue",
    subtitle: "Module A - Search and filter campus resources",
    cta: "Open Module A",
    to: "/resources",
  },
  {
    title: "Make a Booking",
    subtitle: "New Booking Request",
    cta: "Book Now",
    to: "/bookings",
  },
  {
    title: "Report an Issue",
    subtitle: "Log an Incident",
    cta: "Report Issue",
    to: "/tickets",
  },
];

const Home = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setResources([]);
        setBookings([]);
        setTickets([]);
        return;
      }

      try {
        const [resourceResponse, bookingResponse, ticketResponse] = await Promise.all([
          resourceApi.list(),
          bookingApi.list(),
          ticketApi.list(),
        ]);

        setResources(resourceResponse.data ?? []);
        setBookings(bookingResponse.data ?? []);
        setTickets(ticketResponse.data ?? []);
      } catch {
        setResources([]);
        setBookings([]);
        setTickets([]);
      }
    };

    load();
  }, [user]);

  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "APPROVED").length,
    [bookings]
  );
  const openTickets = useMemo(
    () => tickets.filter((ticket) => !["CLOSED", "RESOLVED", "REJECTED"].includes(ticket.status)).length,
    [tickets]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING").length,
    [bookings]
  );

  const searchHref = "/resources";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#052d27] pt-24 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,27,26,0.48)_0%,rgba(3,27,26,0.38)_22%,rgba(3,27,26,0.62)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,242,222,0.14),transparent_38%)]" />

      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[rgba(4,27,24,0.22)] px-5 py-10 text-center shadow-[0_28px_90px_rgba(3,27,26,0.35)] backdrop-blur-[3px] sm:px-8 md:px-10 md:py-14">
          <h1 className="font-display text-5xl font-extrabold tracking-[-0.05em] text-white sm:text-6xl md:text-7xl">
            sliit nexus
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-[#e0efea] sm:text-lg">
            Seamless facility booking and maintenance operations.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold uppercase tracking-[0.16em] text-[#bfe8db] sm:text-base">
            Featured for IT3030 Module A: Facilities and Assets Catalogue
          </p>

          <div className="mx-auto mt-8 flex max-w-3xl flex-col items-stretch gap-3 rounded-full border border-white/50 bg-white p-2 shadow-[0_18px_50px_rgba(3,27,26,0.22)] sm:flex-row sm:items-center">
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search resources, bookings, or tickets..."
              className="w-full border-none bg-transparent px-4 py-3 text-base text-[#12302d] outline-none placeholder:text-[#9aa8a5]"
            />
            <Link
              to={searchHref}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2f8a74] px-7 py-3 text-base font-extrabold text-white transition hover:bg-[#236a59]"
            >
              Search
            </Link>
          </div>
        </div>

        <div className="mt-10 grid w-full gap-5 md:grid-cols-3">
          {actionCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.5rem] border border-[#a5d8c8] bg-[#dff4eb] p-5 text-[#062321] shadow-[0_20px_50px_rgba(3,27,26,0.22)]"
            >
              <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em]">{card.title}</h2>
              <p className="mt-4 text-lg font-bold text-[#204f45]">{card.subtitle}</p>
              <Link
                to={card.to}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#2f8a74] px-4 py-3 text-base font-extrabold text-white transition hover:bg-[#236a59]"
              >
                {card.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 w-full">
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
            Your Dashboard
          </h2>

          <div className="mt-4 rounded-[1.6rem] border border-[#b5e0d3] bg-[#ecf7f1] p-5 text-[#062321] shadow-[0_20px_60px_rgba(3,27,26,0.22)]">
            <h3 className="text-2xl font-extrabold text-[#18463d]">Take Action</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1rem] bg-white p-4">
                <p className="text-sm font-bold text-[#4d8d7f]">Total Resources</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? resources.length : 0}
                </p>
              </div>

              <div className="rounded-[1rem] bg-white p-4">
                <p className="text-sm font-bold text-[#4d8d7f]">Approved Bookings</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? approvedBookings : 0}
                </p>
              </div>

              <div className="rounded-[1rem] bg-white p-4">
                <p className="text-sm font-bold text-[#4d8d7f]">Open Tickets</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? openTickets : 0}
                </p>
              </div>

              <div className="rounded-[1rem] bg-white p-4">
                <p className="text-sm font-bold text-[#4d8d7f]">Pending Bookings</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? pendingBookings : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
