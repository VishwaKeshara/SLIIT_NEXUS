import { useEffect, useMemo, useRef, useState } from "react";
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
    // Phone: allow +, digits, spaces, hyphens, dots, parentheses
    // Must contain 7–15 digits (ITU-T E.164 range)
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

  const isElevated = user?.roles?.some((r) =>
    ["ADMIN", "MANAGER", "TECHNICIAN"].includes(r),
  );
  const isAdmin = user?.roles?.includes("ADMIN");

  const loadTickets = async () => {
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
  };

  useEffect(() => {
    loadTickets();
    resourceApi
      .list()
      .then(({ data }) => setAllResources(data))
      .catch(() => {});
  }, []);

  const locationOptions = useMemo(
    () =>
      [...new Set(allResources.map((r) => r.location).filter(Boolean))].sort(),
    [allResources],
  );

  const resourcesForLocation = useMemo(
    () =>
      formState.location
        ? allResources.filter(
            (r) => r.location === formState.location && r.status === "ACTIVE",
          )
        : [],
    [allResources, formState.location],
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
    <main className="min-h-screen bg-[#f3f8f5] px-4 pb-16 pt-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#39766a]">
              Module C
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[#0f342e]">
              Maintenance & Incident Tickets
            </h1>
            <p className="mt-2 max-w-2xl text-[#5c746d]">
              Report faults, damaged equipment, or service issues. Track
              progress from OPEN through to RESOLVED.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setContactError("");
            }}
            className="rounded-[1rem] bg-[#103c35] px-5 py-3 font-bold text-white transition hover:bg-[#0b2e29]"
          >
            {showCreate ? "Cancel" : "+ New Ticket"}
          </button>
        </div>

        {/* Create ticket form */}
        {showCreate && (
          <section className="mt-6 rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">
              New Report
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#0f342e]">
              Create Incident Ticket
            </h2>
            <form
              className="mt-6 rounded-[1.6rem] border border-[#dbe7df] bg-[#f8fbf9] p-5 grid gap-4 md:grid-cols-2 sm:p-6"
              onSubmit={handleCreateTicket}
            >
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-[#0f342e]">
                  Title <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  name="title"
                  value={formState.title}
                  onChange={handleFormChange}
                  placeholder="Brief summary of the issue"
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="flex items-center justify-between text-sm font-bold text-[#0f342e]">
                  <span>
                    Description <span className="text-red-500">*</span>
                  </span>
                  <span
                    className={`text-xs font-normal ${formState.description.length > 240 ? "text-red-500" : "text-[#7a918a]"}`}
                  >
                    {formState.description.length}/250
                  </span>
                </span>
                <textarea
                  required
                  name="description"
                  value={formState.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) handleFormChange(e);
                  }}
                  rows={3}
                  maxLength={250}
                  placeholder="Detailed description of the incident"
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Location <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  name="location"
                  value={formState.location}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                >
                  <option value="">— Select a location —</option>
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Resource
                </span>
                <select
                  name="resourceId"
                  value={formState.resourceId}
                  onChange={handleFormChange}
                  disabled={
                    !formState.location || resourcesForLocation.length === 0
                  }
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7] disabled:bg-[#eef3f0] disabled:text-[#7a918a]"
                >
                  <option value="">
                    {!formState.location
                      ? "Select a location first"
                      : resourcesForLocation.length === 0
                        ? "No active resources at this location"
                        : "— Select a resource (optional) —"}
                  </option>
                  {resourcesForLocation.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.type ? ` · ${r.type.replaceAll("_", " ")}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Priority <span className="text-red-500">*</span>
                </span>
                <select
                  name="priority"
                  value={formState.priority}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Category
                </span>
                <select
                  name="category"
                  value={formState.category}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                >
                  <option value="">— Select a category (optional) —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">
                  Preferred Contact
                </span>
                <input
                  name="preferredContact"
                  value={formState.preferredContact}
                  onChange={(e) => {
                    handleFormChange(e);
                    setContactError("");
                  }}
                  onBlur={() => {
                    if (!isValidContact(formState.preferredContact)) {
                      setContactError(
                        "Enter a valid email address or phone number.",
                      );
                    }
                  }}
                  placeholder="Phone / email (optional)"
                  className={`mt-2 w-full rounded-[1rem] border px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7] ${
                    contactError
                      ? "border-red-400 bg-red-50"
                      : "border-[#dbe7df] bg-white"
                  }`}
                />
                {contactError && (
                  <p className="mt-1 text-xs font-bold text-red-600">
                    {contactError}
                  </p>
                )}
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-[#0f342e]">
                  Image Attachments (up to 3)
                </span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-[1rem] border border-[#dbe7df] bg-white px-3 py-2 text-sm font-semibold text-[#3e6259]"
                    >
                      <span>{f.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {files.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-[1rem] border-2 border-dashed border-[#dbe7df] px-4 py-2 text-sm font-bold text-[#5c746d] hover:border-[#39766a] hover:text-[#39766a]"
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
              </label>

              {formError && (
                <p className="text-sm font-bold text-red-600 md:col-span-2">
                  {formError}
                </p>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[1rem] bg-[#103c35] px-6 py-3 font-bold text-white transition hover:bg-[#0b2e29] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Ticket list */}
        <div className="mt-8 space-y-5">
          {loading && (
            <div className="rounded-[2rem] border border-[#dbe7df] bg-[#f8fbf9] p-8 text-center font-semibold text-[#5c746d]">
              Loading tickets...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center font-semibold text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && tickets.length === 0 && (
            <div className="rounded-[2rem] border border-[#dbe7df] bg-[#f8fbf9] p-8 text-center font-semibold text-[#5c746d]">
              No tickets yet. Create your first incident report above.
            </div>
          )}

          {tickets.map((ticket) => {
            const isOwner = user?.id === ticket.createdByUserId;
            const isOpen = expandedId === ticket.id;

            return (
              <article
                key={ticket.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_18px_44px_rgba(15,52,46,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(15,52,46,0.15)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(226,241,235,0.38))]" />
                {/* Ticket header — click to expand */}
                <button
                  type="button"
                  className="relative w-full text-left px-6 pt-6 pb-4"
                  onClick={() => setExpandedId(isOpen ? null : ticket.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wide ${STATUS_COLORS[ticket.status] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {ticket.status?.replace("_", " ")}
                        </span>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wide ${PRIORITY_COLORS[ticket.priority] ?? "bg-slate-100"}`}
                        >
                          {ticket.priority}
                        </span>
                        {ticket.category && (
                          <span className="rounded-full bg-[#f3f8f5] px-3 py-0.5 text-xs font-black uppercase tracking-wide text-[#39766a] ring-1 ring-[#dbe7df]">
                            {ticket.category}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-[#0f342e]">
                        {ticket.title}
                      </h2>
                      <p className="mt-1 text-sm text-[#5c746d]">
                        {ticket.location}
                        {ticket.assignedToUserId && (
                          <span className="ml-3 font-semibold text-[#39766a]">
                            Assigned: {ticket.assignedToUserId}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="relative text-[#7a918a]">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="relative border-t border-[#dbe7df] px-6 pb-6 pt-4 space-y-5">
                    {/* Description */}
                    <p className="text-[#3e6259]">{ticket.description}</p>

                    {ticket.preferredContact && (
                      <p className="text-sm text-[#5c746d]">
                        Contact:{" "}
                        <span className="font-semibold text-[#0f342e]">
                          {ticket.preferredContact}
                        </span>
                      </p>
                    )}

                    {/* Resolution / Rejection notes */}
                    {ticket.resolutionNotes && (
                      <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                        <p className="text-sm font-bold text-green-800">
                          Resolution Notes
                        </p>
                        <p className="mt-1 text-sm text-green-700">
                          {ticket.resolutionNotes}
                        </p>
                      </div>
                    )}
                    {ticket.rejectionReason && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <p className="text-sm font-bold text-red-800">
                          Rejection Reason
                        </p>
                        <p className="mt-1 text-sm text-red-700">
                          {ticket.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Attachments */}
                    {(ticket.imageAttachments?.length > 0 ||
                      (isOwner && ticket.imageAttachments?.length < 3)) && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">
                          Attachments
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {ticket.imageAttachments?.map((filename) => (
                            <div key={filename} className="group relative">
                              <img
                                src={ticketApi.getAttachmentUrl(
                                  ticket.id,
                                  filename,
                                )}
                                alt={filename}
                                className="h-20 w-20 rounded-[1rem] object-cover border border-[#dbe7df]"
                              />
                              {(isOwner || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteAttachment(ticket.id, filename)
                                  }
                                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white group-hover:flex"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          {isOwner && ticket.imageAttachments?.length < 3 && (
                            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-[1rem] border-2 border-dashed border-[#dbe7df] text-[#7a918a] hover:border-[#39766a] hover:text-[#39766a]">
                              +
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

                    {/* Staff actions */}
                    {isElevated && (
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#5b7493]">
                            Status:
                          </span>
                          <select
                            value={ticket.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === "REJECTED") {
                                setStatusModal({
                                  ticketId: ticket.id,
                                  status: newStatus,
                                });
                                setStatusReason("");
                                setStatusNotes("");
                              } else if (newStatus === "RESOLVED") {
                                setStatusModal({
                                  ticketId: ticket.id,
                                  status: newStatus,
                                });
                                setStatusReason("");
                                setStatusNotes("");
                              } else {
                                ticketApi
                                  .updateStatus(ticket.id, newStatus)
                                  .then(loadTickets);
                              }
                            }}
                            className="rounded-[0.9rem] border border-[#dbe7df] bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                          >
                            {STATUS_FLOW.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        {(isAdmin || user?.roles?.includes("MANAGER")) && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModal(ticket.id);
                              setAssignUserId(ticket.assignedToUserId ?? "");
                            }}
                            className="rounded-[0.9rem] bg-[#f2d45c] px-4 py-2 text-sm font-bold text-[#103c35] transition hover:bg-[#f7df76]"
                          >
                            {ticket.assignedToUserId
                              ? "Reassign"
                              : "Assign Technician"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Delete ticket */}
                    {(isOwner || isAdmin) && (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="rounded-[0.9rem] bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                        >
                          Delete Ticket
                        </button>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="rounded-[1.4rem] bg-[#f8fbf9] p-5 ring-1 ring-[#dbe7df]">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-[#39766a]">
                        Comments ({ticket.comments?.length ?? 0})
                      </p>
                      <div className="mt-3 space-y-3">
                        {ticket.comments?.length === 0 && (
                          <p className="text-sm font-semibold text-[#7a918a]">
                            No comments yet.
                          </p>
                        )}
                        {ticket.comments?.map((comment) => {
                          const isCommentOwner =
                            user?.id === comment.authorUserId;
                          const isEditing =
                            editingComment?.ticketId === ticket.id &&
                            editingComment?.commentId === comment.id;

                          return (
                            <div
                              key={comment.id}
                              className="rounded-[1rem] border border-[#dbe7df] bg-white p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-extrabold text-[#0f342e]">
                                  {comment.authorName}
                                </p>
                                <div className="flex gap-2">
                                  {isCommentOwner && !isEditing && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingComment({
                                          ticketId: ticket.id,
                                          commentId: comment.id,
                                          value: comment.content,
                                        })
                                      }
                                      className="text-xs font-bold text-[#39766a] hover:underline"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {(isCommentOwner || isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(
                                          ticket.id,
                                          comment.id,
                                        )
                                      }
                                      className="text-xs font-bold text-red-500 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                              {isEditing ? (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    value={editingComment.value}
                                    onChange={(e) =>
                                      setEditingComment((prev) => ({
                                        ...prev,
                                        value: e.target.value,
                                      }))
                                    }
                                    className="flex-1 rounded-[0.9rem] border border-[#dbe7df] bg-[#f8fbf9] px-3 py-2 text-sm text-[#0f342e] outline-none focus:border-[#39766a]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveEditComment(ticket.id, comment.id)
                                    }
                                    className="rounded-[0.9rem] bg-[#103c35] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#0b2e29]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingComment(null)}
                                    className="rounded-[0.9rem] bg-[#6b7f78] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#52645f]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm font-semibold text-[#3e6259]">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-col gap-2 md:flex-row">
                        <input
                          value={commentDrafts[ticket.id] ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [ticket.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a comment..."
                          className="flex-1 rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm text-[#0f342e] outline-none focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              submitComment(ticket.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => submitComment(ticket.id)}
                          className="rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29]"
                        >
                          Post
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
          <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
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
                className="rounded-[1rem] bg-[#6b7f78] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#52645f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                className={`rounded-[1rem] px-5 py-2.5 text-sm font-bold text-white transition ${
                  statusModal.status === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08231f]/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
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
                className="rounded-[1rem] bg-[#6b7f78] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#52645f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                className="rounded-[1rem] bg-[#103c35] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b2e29]"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TicketsPage;
