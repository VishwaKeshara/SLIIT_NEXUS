import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, bookingApi, notificationApi, resourceApi, ticketApi } from "../services/api";
import { useAuth } from "../context/useAuth";

const allRoles = ["USER", "ADMIN", "TECHNICIAN", "MANAGER"];
const fallbackRoles = ["USER"];
const emptyForm = { displayName: "", email: "", password: "", roles: fallbackRoles };

const normalizeRoles = (roles) => {
  const roleValues = Array.isArray(roles) ? roles : [roles];
  const normalized = roleValues
    .map((role) => String(role ?? "").replace(/^ROLE_/, "").trim().toUpperCase())
    .filter((role) => allRoles.includes(role));
  return normalized.length > 0 ? [...new Set(normalized)] : fallbackRoles;
};

const titleize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const relTime = (value) => {
  if (!value) return "Just now";
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff) || diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const pct = (value, total) => `${total ? Math.max((value / total) * 100, 8) : 0}%`;

const getAdminFormError = (err) => {
  const response = err?.response?.data;
  const fieldErrors = response?.errors ? Object.entries(response.errors).map(([field, message]) => `${field}: ${message}`) : [];
  if (fieldErrors.length > 0) return fieldErrors.join(" ");
  return response?.message ?? "Unable to save the user account.";
};

const statusTone = (status) =>
  ({
    OPEN: "bg-amber-100 text-amber-800",
    IN_PROGRESS: "bg-sky-100 text-sky-800",
    RESOLVED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-slate-100 text-slate-700",
    REJECTED: "bg-rose-100 text-rose-800",
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-slate-100 text-slate-700",
  })[status] ?? "bg-slate-100 text-slate-700";

const StatCard = ({ detail, label, value }) => (
  <article className="rounded-[1.6rem] border border-white/10 bg-white p-6 shadow-[0_18px_50px_rgba(6,34,30,0.1)]">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b8f88]">{label}</p>
    <p className="mt-4 font-display text-4xl font-extrabold tracking-[-0.05em] text-[#07251f]">{value}</p>
    <p className="mt-2 text-sm font-semibold text-[#60726c]">{detail}</p>
  </article>
);

const Panel = ({ action, children, eyebrow, title }) => (
  <section className="rounded-[1.8rem] border border-white/10 bg-white p-6 shadow-[0_18px_50px_rgba(6,34,30,0.1)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6a13]">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#07251f]">{title}</h3>
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const MetricBar = ({ color, label, total, value }) => (
  <div>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-bold text-[#123a32]">{label}</p>
      <p className="text-sm font-black text-[#8a6a13]">{value}</p>
    </div>
    <div className="mt-2 h-3 rounded-full bg-[#e7efeb]">
      <div className={`h-3 rounded-full ${color}`} style={{ width: pct(value, total) }} />
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, resourcesRes, bookingsRes, ticketsRes, notificationsRes] = await Promise.all([
        adminApi.listUsers(),
        resourceApi.list(),
        bookingApi.list(),
        ticketApi.list(),
        notificationApi.list(),
      ]);
      setUsers(usersRes.data ?? []);
      setResources(resourcesRes.data ?? []);
      setBookings(bookingsRes.data ?? []);
      setTickets(ticketsRes.data ?? []);
      setNotifications(notificationsRes.data ?? []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError("You are not signed in. Log in with an account that has the ADMIN role.");
      else if (status === 403) setError("Your account is signed in, but it does not have the ADMIN role.");
      else setError(err?.response?.data?.message ?? "The admin analytics dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const resetForm = () => {
    setEditingUserId(null);
    setUserForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const toggleFormRole = (role) => {
    setUserForm((current) => {
      const currentRoles = normalizeRoles(current.roles);
      const nextRoles = currentRoles.includes(role) ? currentRoles.filter((item) => item !== role) : [...currentRoles, role];
      return { ...current, roles: normalizeRoles(nextRoles) };
    });
  };

  const startEdit = (account) => {
    setEditingUserId(account.id);
    setUserForm({
      displayName: account.displayName,
      email: account.email,
      password: "",
      roles: normalizeRoles(account.roles),
    });
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    if (!editingUserId && userForm.password.trim().length < 8) {
      setFormError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }
    if (editingUserId && userForm.password.trim() && userForm.password.trim().length < 8) {
      setFormError("Password must be at least 8 characters, or leave it blank to keep the current password.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = { ...userForm, roles: normalizeRoles(userForm.roles) };
      if (editingUserId) {
        await adminApi.updateUser(editingUserId, { ...payload, password: userForm.password.trim() ? userForm.password : undefined });
      } else {
        await adminApi.createUser(payload);
      }
      resetForm();
      await loadDashboard();
    } catch (err) {
      setFormError(getAdminFormError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = async (targetUser, role) => {
    const currentRoles = normalizeRoles(targetUser.roles);
    const nextRoles = currentRoles.includes(role) ? currentRoles.filter((item) => item !== role) : [...currentRoles, role];
    if (nextRoles.length === 0) return;
    await adminApi.updateRoles(targetUser.id, normalizeRoles(nextRoles));
    await loadDashboard();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user account?")) return;
    await adminApi.deleteUser(userId);
    if (editingUserId === userId) resetForm();
    await loadDashboard();
  };

  const kpis = useMemo(() => ({
    activeResources: resources.filter((item) => item.status === "ACTIVE").length,
    offlineResources: resources.filter((item) => item.status === "OUT_OF_SERVICE").length,
    pendingBookings: bookings.filter((item) => item.status === "PENDING").length,
    approvedBookings: bookings.filter((item) => item.status === "APPROVED").length,
    openTickets: tickets.filter((item) => ["OPEN", "IN_PROGRESS"].includes(item.status)).length,
    criticalTickets: tickets.filter((item) => item.priority === "CRITICAL" && item.status !== "CLOSED").length,
  }), [bookings, resources, tickets]);

  const resourceMix = useMemo(() => ({
    halls: resources.filter((item) => item.type === "LECTURE_HALL").length,
    labs: resources.filter((item) => item.type === "LAB").length,
    rooms: resources.filter((item) => item.type === "MEETING_ROOM").length,
    equipment: resources.filter((item) => item.type === "EQUIPMENT").length,
  }), [resources]);

  const bookingMix = useMemo(() => ({
    pending: bookings.filter((item) => item.status === "PENDING").length,
    approved: bookings.filter((item) => item.status === "APPROVED").length,
    rejected: bookings.filter((item) => item.status === "REJECTED").length,
    cancelled: bookings.filter((item) => item.status === "CANCELLED").length,
  }), [bookings]);

  const ticketMix = useMemo(() => ({
    open: tickets.filter((item) => item.status === "OPEN").length,
    progress: tickets.filter((item) => item.status === "IN_PROGRESS").length,
    resolved: tickets.filter((item) => item.status === "RESOLVED").length,
    closed: tickets.filter((item) => item.status === "CLOSED").length,
  }), [tickets]);

  const alerts = useMemo(() => {
    const items = [];
    if (kpis.offlineResources) items.push({ title: `${kpis.offlineResources} resources offline`, detail: "Maintenance demand is affecting campus availability." });
    if (kpis.criticalTickets) items.push({ title: `${kpis.criticalTickets} critical incidents`, detail: "Escalate response and confirm technician ownership." });
    if (kpis.pendingBookings) items.push({ title: `${kpis.pendingBookings} approval requests`, detail: "Delays may affect lectures, labs, and event schedules." });
    if (notifications.length) items.push({ title: `${notifications.length} new notifications`, detail: "Unread operational messages need review." });
    return items.slice(0, 4);
  }, [kpis, notifications.length]);

  const queueItems = useMemo(() => {
    const bookingQueue = bookings.filter((item) => item.status === "PENDING").slice(0, 3).map((item) => ({
      id: `b-${item.id}`,
      title: item.resourceName,
      detail: `${item.date} · ${item.startTime} - ${item.endTime}`,
      tag: "Booking Approval",
      status: item.status,
    }));
    const ticketQueue = tickets.filter((item) => ["OPEN", "IN_PROGRESS"].includes(item.status)).slice(0, 3).map((item) => ({
      id: `t-${item.id}`,
      title: item.title,
      detail: `${item.priority} · ${item.location || "Campus support"}`,
      tag: "Ticket Review",
      status: item.status,
    }));
    return [...bookingQueue, ...ticketQueue];
  }, [bookings, tickets]);

  const recentActivity = useMemo(() => {
    const items = [
      ...bookings.slice(0, 4).map((item) => ({
        id: `booking-${item.id}`,
        kind: "Booking",
        title: item.resourceName,
        detail: `${item.status} reservation for ${item.date}`,
        timestamp: item.updatedAt ?? item.createdAt,
      })),
      ...tickets.slice(0, 4).map((item) => ({
        id: `ticket-${item.id}`,
        kind: "Ticket",
        title: item.title,
        detail: `${titleize(item.status)} issue in ${item.location || "operations"}`,
        timestamp: item.updatedAt ?? item.createdAt,
      })),
      ...resources.slice(0, 4).map((item) => ({
        id: `resource-${item.id}`,
        kind: "Resource",
        title: item.name,
        detail: `${titleize(item.type)} at ${item.location}`,
        timestamp: item.updatedAt ?? item.createdAt,
      })),
    ];
    return items.sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0)).slice(0, 8);
  }, [bookings, resources, tickets]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#154337_0%,#0d2b25_24%,#061713_58%,#04110e_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1820px]">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,32,27,0.94),rgba(12,54,46,0.88)_42%,rgba(249,250,247,0.98)_130%)] shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
          <div className="grid xl:grid-cols-[320px_1fr]">
            <aside className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(5,20,17,0.98),rgba(12,47,40,0.98))] p-6 text-white xl:p-8">
              <div className="flex items-center gap-4 border-b border-white/10 pb-7">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[#d4af37] text-2xl font-black tracking-[0.12em] text-[#07251f]">NX</div>
                <div>
                  <p className="font-display text-3xl font-extrabold">SLIIT Nexus</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-[#d7c27c]">Admin Control Center</p>
                </div>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7c27c]">Signed in</p>
                <p className="mt-3 text-xl font-extrabold">{user?.displayName}</p>
                <p className="mt-1 text-sm font-semibold text-white/70">{user?.email}</p>
              </div>

              <div className="mt-6 space-y-3">
                <Link to="/resources/dashboard" className="block rounded-[1.1rem] bg-[#d4af37] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#07251f] transition hover:bg-[#e0bf58]">Resource Command</Link>
                <Link to="/tickets" className="block rounded-[1.1rem] border border-white/10 bg-white/8 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/12">Ticketing Desk</Link>
                <Link to="/bookings" className="block rounded-[1.1rem] border border-white/10 bg-white/8 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/12">Booking Oversight</Link>
                <Link to="/notifications" className="block rounded-[1.1rem] border border-white/10 bg-white/8 px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/12">Alert Center</Link>
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-[#d4af37]/30 bg-[#d4af37]/10 p-5 text-[#f9f3db]">
                <p className="text-xs font-black uppercase tracking-[0.18em]">Executive Summary</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-4"><p className="text-sm font-bold">Campus users</p><p className="text-2xl font-extrabold">{users.length}</p></div>
                  <div className="flex items-center justify-between gap-4"><p className="text-sm font-bold">Bookable assets</p><p className="text-2xl font-extrabold">{resources.length}</p></div>
                  <div className="flex items-center justify-between gap-4"><p className="text-sm font-bold">Service load</p><p className="text-2xl font-extrabold">{kpis.openTickets + kpis.pendingBookings}</p></div>
                </div>
              </div>
            </aside>

            <div className="bg-[linear-gradient(180deg,rgba(247,249,246,0.98),rgba(239,245,241,0.98))] p-6 text-[#07251f] sm:p-8">
              <header className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-4xl">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8a6a13]">Smart Campus Analytics</p>
                  <h1 className="mt-3 text-5xl font-extrabold tracking-[-0.06em] text-[#07251f] sm:text-6xl">University Admin Control Center</h1>
                  <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#536861] sm:text-lg">Monitor resources, ticketing, and bookings from a premium enterprise dashboard built for smart campus administration.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={loadDashboard} className="rounded-[1rem] bg-[#07251f] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#0f382f]">Refresh Data</button>
                  <Link to="/" className="rounded-[1rem] border border-[#c8d7d0] bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#07251f] transition hover:bg-[#f7faf8]">Back Home</Link>
                </div>
              </header>

              {loading && <div className="mt-8 rounded-[1.6rem] border border-[#d7e2dd] bg-white p-6 text-base font-semibold text-[#5c746d] shadow-sm">Loading campus analytics and operational summaries...</div>}

              {!loading && error && (
                <div className="mt-8 rounded-[1.6rem] border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="font-bold text-red-700">{error}</p>
                  <Link to="/login" className="mt-4 inline-flex rounded-[1rem] bg-[#07251f] px-4 py-2 font-bold text-white hover:bg-[#0f382f]">Go to login</Link>
                </div>
              )}

              {!loading && !error && (
                <>
                  <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Resources Online" value={kpis.activeResources} detail={`${kpis.offlineResources} currently offline or under maintenance.`} />
                    <StatCard label="Approval Queue" value={kpis.pendingBookings} detail="Pending space and equipment requests awaiting admin decision." />
                    <StatCard label="Open Tickets" value={kpis.openTickets} detail={`${kpis.criticalTickets} critical issues still unresolved.`} />
                    <StatCard label="Confirmed Bookings" value={kpis.approvedBookings} detail="Approved campus reservations active across operational spaces." />
                  </section>

                  <section className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
                    <Panel eyebrow="Operations Pulse" title="Management Summaries">
                      <div className="grid gap-5 lg:grid-cols-3">
                        <div className="rounded-[1.4rem] border border-[#d9e3de] bg-[#f8fbf9] p-5">
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7a8f88]">Resources</p>
                          <div className="mt-4 space-y-4">
                            <MetricBar color="bg-[#0f5a48]" label="Lecture Halls" total={resources.length} value={resourceMix.halls} />
                            <MetricBar color="bg-[#14745c]" label="Labs" total={resources.length} value={resourceMix.labs} />
                            <MetricBar color="bg-[#1f8a6c]" label="Meeting Rooms" total={resources.length} value={resourceMix.rooms} />
                            <MetricBar color="bg-[#d4af37]" label="Equipment" total={resources.length} value={resourceMix.equipment} />
                          </div>
                        </div>
                        <div className="rounded-[1.4rem] border border-[#d9e3de] bg-[#f8fbf9] p-5">
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7a8f88]">Bookings</p>
                          <div className="mt-4 space-y-4">
                            <MetricBar color="bg-[#d4af37]" label="Pending" total={bookings.length} value={bookingMix.pending} />
                            <MetricBar color="bg-[#1f8a6c]" label="Approved" total={bookings.length} value={bookingMix.approved} />
                            <MetricBar color="bg-[#c96046]" label="Rejected" total={bookings.length} value={bookingMix.rejected} />
                            <MetricBar color="bg-[#94a3b8]" label="Cancelled" total={bookings.length} value={bookingMix.cancelled} />
                          </div>
                        </div>
                        <div className="rounded-[1.4rem] border border-[#d9e3de] bg-[#f8fbf9] p-5">
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7a8f88]">Ticketing</p>
                          <div className="mt-4 space-y-4">
                            <MetricBar color="bg-[#eab308]" label="Open" total={tickets.length} value={ticketMix.open} />
                            <MetricBar color="bg-[#3b82f6]" label="In Progress" total={tickets.length} value={ticketMix.progress} />
                            <MetricBar color="bg-[#22c55e]" label="Resolved" total={tickets.length} value={ticketMix.resolved} />
                            <MetricBar color="bg-[#94a3b8]" label="Closed" total={tickets.length} value={ticketMix.closed} />
                          </div>
                        </div>
                      </div>
                    </Panel>

                    <Panel eyebrow="Action Center" title="Quick Actions" action={<span className="rounded-full bg-[#07251f] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">Live</span>}>
                      <div className="grid gap-3">
                        <Link to="/resources/add" className="rounded-[1.25rem] border border-[#d7e2dd] bg-[linear-gradient(135deg,#07251f,#134538)] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:translate-y-[-1px]">Register New Resource</Link>
                        <Link to="/resources/bulk-import" className="rounded-[1.25rem] border border-[#d7e2dd] bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#07251f] transition hover:bg-[#f8fbf9]">Bulk Import Resources</Link>
                        <Link to="/tickets" className="rounded-[1.25rem] border border-[#d7e2dd] bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#07251f] transition hover:bg-[#f8fbf9]">Review Incident Tickets</Link>
                        <Link to="/bookings" className="rounded-[1.25rem] border border-[#d7e2dd] bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#07251f] transition hover:bg-[#f8fbf9]">Open Booking Desk</Link>
                      </div>
                    </Panel>
                  </section>

                  <section className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr_1fr]">
                    <Panel eyebrow="Alerts" title="Operational Risks">
                      <div className="space-y-3">
                        {alerts.length === 0 ? (
                          <div className="rounded-[1.25rem] border border-[#d9e3de] bg-[#f8fbf9] px-4 py-4 text-sm font-semibold text-[#60726c]">No critical alerts right now. Systems are running within normal thresholds.</div>
                        ) : (
                          alerts.map((alert) => (
                            <article key={alert.title} className="rounded-[1.25rem] border border-[#f3df9b] bg-[#fff8df] px-4 py-4">
                              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#8a6a13]">Attention</p>
                              <h4 className="mt-2 text-base font-extrabold text-[#07251f]">{alert.title}</h4>
                              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d6657]">{alert.detail}</p>
                            </article>
                          ))
                        )}
                      </div>
                    </Panel>

                    <Panel eyebrow="Queues" title="Approvals And Reviews">
                      <div className="space-y-3">
                        {queueItems.length === 0 ? (
                          <div className="rounded-[1.25rem] border border-[#d9e3de] bg-[#f8fbf9] px-4 py-4 text-sm font-semibold text-[#60726c]">No pending queues at the moment.</div>
                        ) : (
                          queueItems.map((item) => (
                            <article key={item.id} className="rounded-[1.25rem] border border-[#d9e3de] bg-[#f8fbf9] px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6a13]">{item.tag}</p>
                                  <h4 className="mt-2 text-base font-extrabold text-[#07251f]">{item.title}</h4>
                                  <p className="mt-2 text-sm font-semibold text-[#60726c]">{item.detail}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusTone(item.status)}`}>{item.status}</span>
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </Panel>

                    <Panel eyebrow="Live Feed" title="Recent Activity">
                      <div className="space-y-3">
                        {recentActivity.map((item) => (
                          <article key={item.id} className="rounded-[1.25rem] border border-[#d9e3de] bg-[#f8fbf9] px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <span className="rounded-full bg-[#07251f] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">{item.kind}</span>
                              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#7b8d87]">{relTime(item.timestamp)}</span>
                            </div>
                            <h4 className="mt-3 text-base font-extrabold text-[#07251f]">{item.title}</h4>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#60726c]">{item.detail}</p>
                          </article>
                        ))}
                      </div>
                    </Panel>
                  </section>

                  <section className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
                    <Panel eyebrow={editingUserId ? "Edit Account" : "Create Account"} title={editingUserId ? "Update an existing user" : "Add a new campus operator"} action={editingUserId ? <button type="button" onClick={resetForm} className="rounded-[1rem] border border-[#d7e2dd] bg-white px-4 py-2 text-sm font-bold text-[#07251f] transition hover:bg-[#f8fbf9]">Cancel Edit</button> : null}>
                      <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-[#d9e3de] bg-[#f8fbf9] p-5">
                        <div className="grid gap-5 md:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-bold text-[#07251f]">Display Name</span>
                            <input name="displayName" value={userForm.displayName} onChange={handleFormChange} className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#0f5a48]" required />
                          </label>
                          <label className="block">
                            <span className="text-sm font-bold text-[#07251f]">Email</span>
                            <input name="email" type="email" value={userForm.email} onChange={handleFormChange} className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#0f5a48]" required />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="text-sm font-bold text-[#07251f]">Password {editingUserId ? "(optional)" : ""}</span>
                            <input name="password" type="password" value={userForm.password} onChange={handleFormChange} placeholder={editingUserId ? "Leave blank to keep current password" : "Set an initial password"} className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#0f5a48]" required={!editingUserId} />
                          </label>
                          <div className="md:col-span-2">
                            <p className="text-sm font-bold text-[#07251f]">Roles</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {allRoles.map((role) => (
                                <button key={role} type="button" onClick={() => toggleFormRole(role)} className={`rounded-full px-4 py-2 text-sm font-bold ${userForm.roles.includes(role) ? "bg-[#07251f] text-white" : "bg-white text-[#0f342e] ring-1 ring-[#dbe7df]"}`}>{role}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                        {formError && <p className="mt-5 rounded-[1.2rem] bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{formError}</p>}
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button type="submit" disabled={submitting} className="rounded-[1rem] bg-[#07251f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f382f] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Saving..." : editingUserId ? "Update User" : "Create User"}</button>
                          <button type="button" onClick={resetForm} className="rounded-[1rem] bg-white px-5 py-3 text-sm font-bold text-[#0f342e] ring-1 ring-[#dbe7df] transition hover:bg-[#f8fbf9]">Reset</button>
                        </div>
                      </form>
                    </Panel>

                    <Panel eyebrow="Campus Access" title="User Management Summary" action={<span className="rounded-full bg-[#d4af37]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#8a6a13]">{users.length} accounts</span>}>
                      <div className="grid gap-4">
                        {users.map((account) => (
                          <article key={account.id} className="rounded-[1.4rem] border border-[#d9e3de] bg-[#f8fbf9] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <h4 className="text-lg font-extrabold text-[#07251f]">{account.displayName}</h4>
                                <p className="mt-1 text-sm font-semibold text-[#60726c]">{account.email}</p>
                                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#8a6a13]">{account.provider ?? "local"}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {normalizeRoles(account.roles).map((role) => (
                                  <span key={role} className="rounded-full bg-[#07251f] px-3 py-1 text-xs font-bold text-white">{role}</span>
                                ))}
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button type="button" onClick={() => startEdit(account)} className="rounded-[1rem] bg-[#07251f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f382f]">Edit Details</button>
                              <button type="button" onClick={() => handleDelete(account.id)} className="rounded-[1rem] bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100">Delete User</button>
                              {allRoles.map((role) => (
                                <button key={role} type="button" onClick={() => toggleRole(account, role)} className={`rounded-[1rem] px-4 py-2 text-sm font-bold ${normalizeRoles(account.roles).includes(role) ? "bg-[#d4af37] text-[#07251f] hover:bg-[#e0bf58]" : "bg-white text-[#0f342e] ring-1 ring-[#dbe7df] hover:bg-[#f8fbf9]"}`}>{normalizeRoles(account.roles).includes(role) ? `Remove ${role}` : `Add ${role}`}</button>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </Panel>
                  </section>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
