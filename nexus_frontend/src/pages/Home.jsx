import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { bookingApi, notificationApi, resourceApi, ticketApi } from "../services/api";

const primaryActions = [
  {
    title: "Facilities Catalogue",
    subtitle: "Explore Catalogue",
    cta: "View Catalogue",
    to: "/availability",
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

const quickFeatures = [
  { title: "Find a Room / Lab", to: "/availability" },
  { title: "Make a Booking", to: "/bookings" },
  { title: "Track Booking Status", to: "/bookings" },
  { title: "Report a Fault", to: "/tickets" },
  { title: "View Notifications", to: "/notifications" },
];

const resourceTypeOptions = ["ALL", "LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const publicRoutes = ["/about-us", "/contact-us"];

const formatEnumLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "";

const formatDateTime = (value) => {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const Home = () => {
  const { user, unreadCount } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [minimumCapacity, setMinimumCapacity] = useState("");

  const isAdmin = user?.roles?.includes("ADMIN");
  const roleBasedAction = isAdmin
    ? { label: "Go to Admin Dashboard", to: "/admin/dashboard" }
    : { label: "My Bookings", to: "/bookings" };
  const linkTarget = (to) => (user || publicRoutes.includes(to) ? to : "/login");
  const linkState = (to) => (user || publicRoutes.includes(to) ? undefined : { from: to });

  useEffect(() => {
    const loadResources = async () => {
      try {
        const { data } = await resourceApi.list();
        setResources(data ?? []);
      } catch {
        setResources([]);
      }
    };

    void loadResources();
  }, []);

  useEffect(() => {
    const loadPrivateData = async () => {
      if (!user) {
        setBookings([]);
        setTickets([]);
        setNotifications([]);
        return;
      }

      try {
        const [bookingResponse, ticketResponse, notificationResponse] = await Promise.all([
          bookingApi.list(),
          ticketApi.list(),
          notificationApi.list(),
        ]);

        setBookings(bookingResponse.data ?? []);
        setTickets(ticketResponse.data ?? []);
        setNotifications(notificationResponse.data ?? []);
      } catch {
        setBookings([]);
        setTickets([]);
        setNotifications([]);
      }
    };

    void loadPrivateData();
  }, [user]);

  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "APPROVED").length,
    [bookings]
  );
  const openTickets = useMemo(
    () => tickets.filter((ticket) => !["RESOLVED", "CLOSED", "REJECTED"].includes(ticket.status)).length,
    [tickets]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING").length,
    [bookings]
  );
  const resolvedTickets = useMemo(
    () => tickets.filter((ticket) => ["RESOLVED", "CLOSED"].includes(ticket.status)).length,
    [tickets]
  );
  const todaysBookings = useMemo(() => {
    const todayLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    return bookings.filter((booking) => booking.dateLabel?.includes(todayLabel)).length;
  }, [bookings]);

  const locationOptions = useMemo(() => {
    const locations = [...new Set(resources.map((resource) => resource.location).filter(Boolean))];
    return ["ALL", ...locations];
  }, [resources]);

  const featuredResources = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const capacityThreshold = minimumCapacity === "" ? null : Number(minimumCapacity);

    return resources
      .filter((resource) => {
        const matchesSearch =
          normalizedSearch === "" ||
          resource.name?.toLowerCase().includes(normalizedSearch) ||
          resource.location?.toLowerCase().includes(normalizedSearch);

        const matchesType = selectedType === "ALL" || resource.type === selectedType;
        const matchesLocation = selectedLocation === "ALL" || resource.location === selectedLocation;
        const matchesCapacity = capacityThreshold === null || (resource.capacity ?? 0) >= capacityThreshold;

        return matchesSearch && matchesType && matchesLocation && matchesCapacity;
      })
      .slice(0, 3);
  }, [minimumCapacity, resources, searchValue, selectedLocation, selectedType]);

  const recentBookings = useMemo(() => bookings.slice(0, 3), [bookings]);
  const recentTickets = useMemo(() => tickets.slice(0, 3), [tickets]);
  const recentNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07251f] pt-28 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,28,25,0.52)_0%,rgba(7,28,25,0.34)_20%,rgba(7,28,25,0.7)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,239,229,0.16),transparent_34%)]" />

      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="pt-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#d6eee5]">Smart Campus Operations Hub</p>
          <h1 className="font-display mt-5 text-5xl font-extrabold tracking-[-0.05em] text-white sm:text-6xl md:text-7xl">
            sliit nexus
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[#e7f3ee] sm:text-xl">
            Manage resources, bookings, incidents, and notifications in one place.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={linkTarget("/availability")}
              state={linkState("/availability")}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#17352f] transition hover:bg-[#eef6f2]"
            >
              Browse Resources
            </Link>
            <Link
              to={linkTarget("/tickets")}
              state={linkState("/tickets")}
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/16"
            >
              Report an Incident
            </Link>
            <Link
              to={linkTarget(roleBasedAction.to)}
              state={linkState(roleBasedAction.to)}
              className="inline-flex items-center justify-center rounded-full border border-[#c9e7dc] bg-[#dff2ea] px-6 py-3 text-sm font-extrabold text-[#17352f] transition hover:bg-[#eef8f3]"
            >
              {user ? roleBasedAction.label : "Login to Continue"}
            </Link>
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-full border border-white/50 bg-white p-2 shadow-[0_20px_60px_rgba(5,30,25,0.28)] sm:flex-row sm:items-center">
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search resources, bookings, or tickets..."
              className="w-full rounded-full border-none bg-transparent px-5 py-3 text-base text-[#17352f] outline-none placeholder:text-[#9aa8a5]"
            />
            <Link
              to={linkTarget("/availability")}
              state={linkState("/availability")}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#3a8a77] px-7 py-3 text-base font-extrabold text-white transition hover:bg-[#2d6e5f]"
            >
              Search
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {primaryActions.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.5rem] border border-[#b7ddd1] bg-[#ddf1e9] p-5 text-[#0b2520] shadow-[0_22px_50px_rgba(6,28,25,0.22)]"
            >
              <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em]">{card.title}</h2>
              <p className="mt-5 text-lg font-extrabold text-[#204b42]">{card.subtitle}</p>
              <Link
                to={linkTarget(card.to)}
                state={linkState(card.to)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#3a8a77] px-4 py-3 text-base font-extrabold text-white transition hover:bg-[#2d6e5f]"
              >
                {card.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
            Your Dashboard
          </h2>

          <div className="mt-5 rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
            <h3 className="text-2xl font-extrabold text-[#1a473f]">Take Action</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Total Resources</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {resources.length}
                </p>
              </div>

              <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Approved Bookings</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? approvedBookings : 0}
                </p>
              </div>

              <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Open Tickets</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? openTickets : 0}
                </p>
              </div>

              <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Pending Bookings</p>
                <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.05em] text-[#062321]">
                  {user ? pendingBookings : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
          <h3 className="text-2xl font-extrabold text-[#1a473f]">Quick Actions</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {quickFeatures.map((feature) => (
              <Link
                key={feature.title}
                to={linkTarget(feature.to)}
                state={linkState(feature.to)}
                className="rounded-[1rem] bg-white px-4 py-5 text-center text-sm font-extrabold text-[#17352f] shadow-sm transition hover:-translate-y-1"
              >
                {feature.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4d8d7f]">Featured Resources</p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#1a473f]">Search & Filter Preview</h3>
              </div>
              <Link
                to={linkTarget("/availability")}
                state={linkState("/availability")}
                className="rounded-full bg-[#3a8a77] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#2d6e5f]"
              >
                View All Resources
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by keyword"
                className="rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none"
              />

              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none"
              >
                {resourceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "Filter by type" : formatEnumLabel(option)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                value={minimumCapacity}
                onChange={(event) => setMinimumCapacity(event.target.value)}
                placeholder="Filter by capacity"
                className="rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none"
              />

              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none"
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "Filter by location" : option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {featuredResources.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm font-semibold text-[#56726a] md:col-span-3">
                  No resources found.
                </div>
              ) : (
                featuredResources.map((resource) => (
                  <article key={resource.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4d8d7f]">
                      {formatEnumLabel(resource.type)}
                    </p>
                    <h4 className="mt-2 text-xl font-extrabold text-[#062321]">{resource.name}</h4>
                    <p className="mt-3 text-sm font-semibold text-[#56726a]">{resource.location}</p>
                    <p className="mt-1 text-sm font-semibold text-[#56726a]">Capacity: {resource.capacity}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4d8d7f]">System Summary</p>
            <h3 className="mt-2 text-2xl font-extrabold text-[#1a473f]">Live Overview</h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Available Resources</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-[#062321]">
                  {resources.filter((resource) => resource.status === "ACTIVE").length}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Pending Bookings</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-[#062321]">{user ? pendingBookings : 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Open Tickets</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-[#062321]">{user ? openTickets : 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Resolved Tickets</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-[#062321]">{user ? resolvedTickets : 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Today's Bookings</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-[#062321]">{user ? todaysBookings : 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-[#4d8d7f]">Unread Notifications</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-[#062321]">{user ? unreadCount : 0}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold text-[#1a473f]">Your Recent Bookings</h3>
              <Link to={linkTarget("/bookings")} state={linkState("/bookings")} className="text-sm font-bold text-[#2d6e5f]">
                View
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {recentBookings.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm font-semibold text-[#56726a]">No bookings yet.</div>
              ) : (
                recentBookings.map((booking) => (
                  <article key={booking.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4d8d7f]">{booking.status}</p>
                    <h4 className="mt-2 text-lg font-extrabold text-[#062321]">{booking.resourceName}</h4>
                    <p className="mt-2 text-sm font-semibold text-[#56726a]">{booking.dateLabel}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold text-[#1a473f]">Latest Ticket Updates</h3>
              <Link to={linkTarget("/tickets")} state={linkState("/tickets")} className="text-sm font-bold text-[#2d6e5f]">
                View
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {recentTickets.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm font-semibold text-[#56726a]">No ticket updates yet.</div>
              ) : (
                recentTickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4d8d7f]">
                      {formatEnumLabel(ticket.status)}
                    </p>
                    <h4 className="mt-2 text-lg font-extrabold text-[#062321]">{ticket.title}</h4>
                    <p className="mt-2 text-sm font-semibold text-[#56726a]">{formatDateTime(ticket.updatedAt)}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#c6e3d9] bg-[#edf7f2] p-5 text-[#0b2520] shadow-[0_20px_60px_rgba(6,28,25,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-extrabold text-[#1a473f]">Recent Notifications</h3>
              <Link to={linkTarget("/notifications")} state={linkState("/notifications")} className="text-sm font-bold text-[#2d6e5f]">
                View
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {recentNotifications.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-sm font-semibold text-[#56726a]">
                  No notifications yet.
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <article key={notification.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4d8d7f]">
                      {formatEnumLabel(notification.type)}
                    </p>
                    <h4 className="mt-2 text-lg font-extrabold text-[#062321]">{notification.title}</h4>
                    <p className="mt-2 text-sm font-semibold text-[#56726a]">{formatDateTime(notification.createdAt)}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

      </section>
    </main>
  );
};

export default Home;
