import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ticketApi, resourceApi } from "../services/api";
import { useAuth } from "../context/useAuth";

const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Facilities",
  "Safety",
  "Other",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_FLOW = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];

const STATUS_COLORS = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-100 text-slate-700",
  REJECTED: "bg-red-100 text-red-800",
};

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-800",
};

const createInitialForm = () => ({
  title: "",
  description: "",
  category: "",
  priority: "MEDIUM",
  location: "",
  resourceId: "",
  preferredContact: "",
});

const TicketsPage = () => {
  const { user, refreshAuth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [formState, setFormState] = useState(createInitialForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [contactError, setContactError] = useState("");
  const [files, setFiles] = useState([]);
  const [allResources, setAllResources] = useState([]);

  const isValidContact = (value) => {
    if (!value.trim()) return true;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRe.test(value.trim())) return true;
    const allowedCharsRe = /^[+]?[\d\s\-().]+$/;
    const digitCount = value.replace(/\D/g, "").length;
    return (
      allowedCharsRe.test(value.trim()) && digitCount >= 7 && digitCount <= 15
    );
  };

  // Expanded ticket
  const [expandedId, setExpandedId] = useState(null);

  // Comment drafts: { [ticketId]: string }
  const [commentDrafts, setCommentDrafts] = useState({});

  // Edit comment: { ticketId, commentId, value }
  const [editingComment, setEditingComment] = useState(null);

  // Status update modal
  const [statusModal, setStatusModal] = useState(null); // { ticketId, status }
  const [statusReason, setStatusReason] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Assign modal
  const [assignModal, setAssignModal] = useState(null); // ticketId
  const [assignUserId, setAssignUserId] = useState("");

  const fileInputRef = useRef(null);

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""))
    : [];
  const isElevated = roles.some((r) =>
    ["ADMIN", "MANAGER", "TECHNICIAN"].includes(r),
  );
  const isAdmin = roles.includes("ADMIN");
  const isManager = roles.includes("MANAGER");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await ticketApi.list();
      setTickets(data);
      await refreshAuth();
    } catch {
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [refreshAuth]);

  useEffect(() => {
    loadTickets();
    resourceApi
      .list()
      .then(({ data }) => setAllResources(data))
      .catch(() => { });
  }, [loadTickets]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status)).length;
    const resolved = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length;
    return { total, open, resolved };
  }, [tickets]);

  const locationOptions = useMemo(
    () =>
      [...new Set(allResources.map((r) => r.location).filter(Boolean))].sort(),
    [allResources],
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "location" ? { resourceId: "" } : {}),
    }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 3) {
      setFormError("Maximum 3 image attachments allowed.");
      return;
    }
    setFiles((prev) => [...prev, ...selected].slice(0, 3));
    setFormError("");
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!isValidContact(formState.preferredContact)) {
      setContactError("Enter a valid email address or phone number.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const { data: created } = await ticketApi.create(formState);
      // Upload attachments sequentially
      for (const file of files) {
        await ticketApi.uploadAttachment(created.id, file);
      }
      setFormState(createInitialForm());
      setFiles([]);
      setContactError("");
      setShowCreate(false);
      await loadTickets();
    } catch (err) {
      setFormError(err?.response?.data?.message ?? "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusModal) return;
    try {
      await ticketApi.updateStatus(
        statusModal.ticketId,
        statusModal.status,
        statusReason || undefined,
        statusNotes || undefined,
      );
      setStatusModal(null);
      setStatusReason("");
      setStatusNotes("");
      await loadTickets();
    } catch {
      /* toast would go here */
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !assignUserId.trim()) return;
    try {
      await ticketApi.assign(assignModal, assignUserId.trim());
      setAssignModal(null);
      setAssignUserId("");
      await loadTickets();
    } catch {
      /* toast */
    }
  };

  const submitComment = async (ticketId) => {
    const content = commentDrafts[ticketId]?.trim();
    if (!content) return;
    try {
      await ticketApi.addComment(ticketId, content);
      setCommentDrafts((prev) => ({ ...prev, [ticketId]: "" }));
      await loadTickets();
    } catch {
      /* toast */
    }
  };

  const saveEditComment = async (ticketId, commentId) => {
    const content = editingComment?.value?.trim();
    if (!content) return;
    try {
      await ticketApi.editComment(ticketId, commentId, content);
      setEditingComment(null);
      await loadTickets();
    } catch {
      /* toast */
    }
  };

  const handleDeleteComment = async (ticketId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await ticketApi.deleteComment(ticketId, commentId);
      await loadTickets();
    } catch {
      /* toast */
    }
  };

  const handleDeleteAttachment = async (ticketId, filename) => {
    if (!window.confirm("Remove this attachment?")) return;
    try {
      await ticketApi.deleteAttachment(ticketId, filename);
      await loadTickets();
    } catch {
      /* toast */
    }
  };

  const handleUploadMore = async (ticketId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await ticketApi.uploadAttachment(ticketId, file);
      await loadTickets();
    } catch (err) {
      alert(err?.response?.data?.message ?? "Upload failed.");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Delete this ticket permanently?")) return;
    try {
      await ticketApi.remove(ticketId);
      await loadTickets();
    } catch {
      /* toast */
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f8f6]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#07251f] pt-28 pb-16 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/sliit-campus-bg.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#07251f] via-[#07251f]/95 to-[#1b4332]/90" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="inline-block rounded-lg bg-[#f2d45c] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#07251f]">
                Incident Management
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Maintenance & Tickets
              </h1>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-300">
                Report campus issues, track progress, and keep support conversations in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreate((v) => !v);
                setContactError("");
              }}
              className="rounded-lg bg-[#f2d45c] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#07251f] shadow-lg shadow-black/10 transition hover:bg-[#f7df76]"
            >
              {showCreate ? "Close Form" : "New Ticket"}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="relative -mt-10 z-10 mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-lg border border-white bg-white/90 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Incidents</p>
            <h3 className="font-display mt-1 text-4xl font-black text-slate-900">{stats.total}</h3>
            <div className="mt-4 h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="rounded-lg border border-white bg-white/90 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#39766a]">Open & In Progress</p>
            <h3 className="font-display mt-1 text-4xl font-black text-slate-900">{stats.open}</h3>
            <div className="mt-4 h-1 w-10 rounded-full bg-emerald-100" />
          </div>
          <div className="rounded-lg border border-white bg-white/90 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Resolved Lately</p>
            <h3 className="font-display mt-1 text-4xl font-black text-slate-900">{stats.resolved}</h3>
            <div className="mt-4 h-1 w-10 rounded-full bg-blue-100" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-24">

        {/* Create ticket form */}
        {showCreate && (
          <section className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="rounded-lg bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-3xl font-black text-slate-900">New Incident Report</h2>
                  <p className="mt-1 text-slate-500">Please provide accurate details to help our team resolve the issue faster.</p>
                </div>
              </div>

              <form
                className="grid gap-6 md:grid-cols-2"
                onSubmit={handleCreateTicket}
              >
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Issue Title</label>
                  <input
                    required
                    name="title"
                    value={formState.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Projector not working in Lab 04"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#39766a]/5"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Description</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${formState.description.length > 240 ? "text-red-500" : "text-slate-400"}`}>
                      {formState.description.length} / 250
                    </span>
                  </label>
                  <textarea
                    required
                    name="description"
                    value={formState.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 250) handleFormChange(e);
                    }}
                    rows={4}
                    maxLength={250}
                    placeholder="Describe what happened, where, and when..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#39766a]/5 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Location</label>
                  <select
                    required
                    name="location"
                    value={formState.location}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#39766a]/5"
                  >
                    <option value="">Select Location</option>
                    {locationOptions.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select
                    name="category"
                    value={formState.category}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#39766a]/5"
                  >
                    <option value="">General Issue</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority Level</label>
                  <select
                    name="priority"
                    value={formState.priority}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#39766a]/5"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Contact Method (Email/Phone)</label>
                  <input
                    name="preferredContact"
                    value={formState.preferredContact}
                    onChange={(e) => {
                      handleFormChange(e);
                      setContactError("");
                    }}
                    placeholder="How can we reach you?"
                    className={`w-full rounded-lg border px-5 py-4 outline-none transition focus:ring-4 ${contactError
                        ? "border-red-400 bg-red-50 focus:ring-red-100"
                        : "border-slate-200 bg-slate-50 focus:border-[#39766a] focus:ring-[#39766a]/5"
                      }`}
                  />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-sm font-bold text-slate-700">Snapshots (Optional)</label>
                  <div className="flex flex-wrap gap-4">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-[#39766a]/20 bg-[#39766a]/5 px-4 py-3 text-sm font-bold text-[#39766a]"
                      >
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700"
                        >
                          x
                        </button>
                      </div>
                    ))}
                    {files.length < 3 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:border-[#39766a] hover:text-[#39766a] hover:bg-slate-50"
                      >
                        + Add Image
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col items-center gap-6 pt-6">
                  {formError && (
                    <p className="text-sm font-bold text-red-600">
                      {formError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full max-w-sm rounded-lg bg-[#07251f] py-3.5 font-display text-lg font-black text-white shadow-xl shadow-[#07251f]/10 transition hover:bg-[#1b4332] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting Report..." : "Submit Incident Report"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Ticket list Header */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-3xl font-black text-slate-900">Active Reports</h2>
          <button onClick={loadTickets} className="text-sm font-bold text-[#39766a] hover:underline">
            Refresh List
          </button>
        </div>

        {/* Ticket list */}
        <div className="space-y-6">
          {loading && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]" />
                <span className="ml-2 font-bold uppercase tracking-widest text-xs">Syncing Tickets...</span>
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-12 text-center text-red-700">
              <p className="font-black text-lg">{error}</p>
            </div>
          )}
          {!loading && !error && tickets.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="font-bold text-slate-400">No active reports found. Everything seems to be in order!</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-sm font-black uppercase tracking-widest text-[#39766a] hover:underline"
              >
                New Ticket
              </button>
            </div>
          )}

          {tickets.map((ticket) => {
            const isOwner = user?.id === ticket.createdByUserId;
            const isOpen = expandedId === ticket.id;

            return (
              <article
                key={ticket.id}
                className={`relative overflow-hidden rounded-lg bg-white transition-all duration-300 ${isOpen
                    ? "shadow-2xl shadow-slate-200/80 ring-2 ring-[#39766a]/10"
                    : "shadow-sm border border-slate-100 hover:shadow-md hover:border-[#39766a]/20"
                  }`}
              >
                {/* Status Bar */}
                <div className={`h-1.5 w-full ${isOpen ? "bg-[#39766a]" : "bg-slate-50 group-hover:bg-slate-100 transition-colors"}`} />

                {/* Ticket header - click to expand */}
                <button
                  type="button"
                  className="w-full text-left px-8 py-7"
                  onClick={() => setExpandedId(isOpen ? null : ticket.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[ticket.status] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {ticket.status?.replace("_", " ")}
                        </span>
                        <span
                          className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest ${PRIORITY_COLORS[ticket.priority] ?? "bg-slate-100"}`}
                        >
                          {ticket.priority}
                        </span>
                        {ticket.category && (
                          <span className="rounded-full bg-slate-50 border border-slate-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {ticket.category}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-display text-2xl font-black text-slate-900 leading-tight">
                          {ticket.title}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#39766a]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {ticket.location}
                          {ticket.assignedToUserId && (
                            <span className="ml-4 flex items-center gap-1.5 border-l border-slate-200 pl-4 py-0.5 text-[#39766a]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#39766a]" />
                              Assigned to {ticket.assignedToUserId}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className={`mt-2 rounded-full p-3 transition-transform duration-300 ${isOpen ? "rotate-180 bg-slate-100" : "bg-slate-50 group-hover:bg-slate-100"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"></path></svg>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/30 px-8 py-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-8 lg:grid-cols-2">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue Description</p>
                          <p className="mt-2 text-slate-600 leading-relaxed font-medium">{ticket.description}</p>
                        </div>

                        {ticket.preferredContact && (
                          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm border border-slate-100">
                            <div className="rounded-full bg-blue-50 p-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Contact</p>
                              <p className="text-sm font-bold text-slate-700">{ticket.preferredContact}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {/* Resolution / Rejection notes */}
                        {ticket.resolutionNotes && (
                          <div className="rounded-[1.5rem] bg-emerald-50 border border-emerald-100 p-6">
                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-800">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              Resolution Details
                            </h4>
                            <p className="mt-3 text-sm font-medium text-emerald-700 leading-relaxed">
                              {ticket.resolutionNotes}
                            </p>
                          </div>
                        )}
                        {ticket.rejectionReason && (
                          <div className="rounded-[1.5rem] bg-rose-50 border border-rose-100 p-6">
                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-rose-800">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                              Rejection Details
                            </h4>
                            <p className="mt-3 text-sm font-medium text-rose-700 leading-relaxed">
                              {ticket.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Attachments */}
                        {(ticket.imageAttachments?.length > 0 || (isOwner && ticket.imageAttachments?.length < 3)) && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attached Evidence</p>
                            <div className="flex flex-wrap gap-4">
                              {ticket.imageAttachments?.map((filename) => (
                                <div key={filename} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                  <img
                                    src={ticketApi.getAttachmentUrl(ticket.id, filename)}
                                    alt={filename}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                  {(isOwner || isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAttachment(ticket.id, filename)}
                                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/90 text-[10px] text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                                    >
                                      x
                                    </button>
                                  )}
                                </div>
                              ))}
                              {isOwner && ticket.imageAttachments?.length < 3 && (
                                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white text-slate-400 transition hover:border-[#39766a] hover:text-[#39766a] hover:bg-slate-50">
                                  <span className="text-xl">+</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleUploadMore(ticket.id, e)}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                      {/* Staff actions */}
                      {isElevated && (
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-3 rounded-lg bg-white border border-slate-200 px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Status</span>
                            <select
                              value={ticket.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (newStatus === "REJECTED" || newStatus === "RESOLVED") {
                                  setStatusModal({ ticketId: ticket.id, status: newStatus });
                                  setStatusReason("");
                                  setStatusNotes("");
                                } else {
                                  ticketApi.updateStatus(ticket.id, newStatus).then(loadTickets);
                                }
                              }}
                              className="bg-transparent text-sm font-bold text-[#39766a] outline-none"
                            >
                              {STATUS_FLOW.map((s) => (
                                <option key={s} value={s}>{s.replace("_", " ")}</option>
                              ))}
                            </select>
                          </div>
                          {(isAdmin || isManager) && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModal(ticket.id);
                                setAssignUserId(ticket.assignedToUserId ?? "");
                              }}
                              className="rounded-lg bg-[#f2d45c] px-6 py-2.5 text-sm font-black uppercase tracking-widest text-[#07251f] shadow-lg shadow-[#f2d45c]/10 transition hover:bg-[#f7df76]"
                            >
                              {ticket.assignedToUserId ? "Reassign" : "Assign Staff"}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {(isOwner || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="rounded-lg bg-red-50 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-100 transition hover:bg-red-600 hover:text-white"
                          >
                            Delete Report
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200/60">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-[#39766a]" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Communication Log ({ticket.comments?.length ?? 0})
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {ticket.comments?.length === 0 && (
                          <p className="py-4 text-center text-sm font-medium text-slate-400 italic">No updates in the log yet.</p>
                        )}
                        {ticket.comments?.map((comment) => {
                          const isCommentOwner = user?.id === comment.authorUserId;
                          const isEditing = editingComment?.ticketId === ticket.id && editingComment?.commentId === comment.id;

                          return (
                            <div key={comment.id} className="group flex flex-col gap-1">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#39766a]">{comment.authorName}</span>
                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isCommentOwner && !isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingComment({ ticketId: ticket.id, commentId: comment.id, value: comment.content })}
                                      className="text-[10px] font-bold text-slate-400 hover:text-[#39766a]"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {(isCommentOwner || isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(ticket.id, comment.id)}
                                      className="text-[10px] font-bold text-slate-400 hover:text-red-500"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className={`rounded-lg p-4 text-sm font-medium ${isCommentOwner ? "bg-slate-50 text-slate-700" : "bg-[#39766a]/5 text-[#39766a]"}`}>
                                {isEditing ? (
                                  <div className="flex flex-col gap-3">
                                    <textarea
                                      value={editingComment.value}
                                      onChange={(e) => setEditingComment((prev) => ({ ...prev, value: e.target.value }))}
                                      className="w-full bg-white rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#39766a]"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setEditingComment(null)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
                                      <button onClick={() => saveEditComment(ticket.id, comment.id)} className="rounded-lg bg-[#39766a] px-4 py-2 text-xs font-bold text-white">Save Changes</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p>{comment.content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-8 flex gap-3">
                        <input
                          value={commentDrafts[ticket.id] ?? ""}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          placeholder="Type a message or update..."
                          className="flex-1 rounded-lg bg-slate-50 border border-slate-100 px-6 py-4 text-sm font-medium outline-none focus:bg-white focus:border-[#39766a] focus:ring-4 focus:ring-[#39766a]/5 transition-all"
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(ticket.id); } }}
                        />
                        <button
                          onClick={() => submitComment(ticket.id)}
                          className="rounded-lg bg-[#07251f] px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#07251f]/10 transition hover:bg-[#1b4332]"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Status update modal (for RESOLVED / REJECTED) */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08231f]/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">
              Staff Action
            </p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#0f342e]">
              {statusModal.status === "REJECTED"
                ? "Reject Ticket"
                : "Mark as Resolved"}
            </h3>
            {statusModal.status === "REJECTED" && (
              <label className="mt-5 block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Rejection Reason
                </span>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-sm text-[#0f342e] outline-none focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                  placeholder="Explain why this ticket is being rejected..."
                />
              </label>
            )}
            {statusModal.status === "RESOLVED" && (
              <label className="mt-5 block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Resolution Notes
                </span>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-sm text-[#0f342e] outline-none focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                  placeholder="Describe how the issue was resolved..."
                />
              </label>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="rounded-lg bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                className={`rounded-lg px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg transition ${statusModal.status === "REJECTED"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  }`}
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08231f]/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">
              Staff Action
            </p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#0f342e]">
              Assign Technician
            </h3>
            <label className="mt-5 block">
              <span className="text-sm font-bold text-[#0f342e]">
                User ID / Email of assignee
              </span>
              <input
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-sm text-[#0f342e] outline-none focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                placeholder="Enter technician user ID"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="rounded-lg bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                className="rounded-lg bg-[#07251f] px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#07251f]/20 transition hover:bg-[#1b4332]"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TicketsPage;


