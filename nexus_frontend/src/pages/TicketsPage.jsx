import { useEffect, useRef, useState } from "react";
import { ticketApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Hardware", "Software", "Network", "Facilities", "Safety", "Other"];
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
  category: "Hardware",
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
  const [files, setFiles] = useState([]);

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

  const isElevated = user?.roles?.some((r) => ["ADMIN", "MANAGER", "TECHNICIAN"].includes(r));
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
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
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
        statusNotes || undefined
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
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Module C</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Maintenance & Incident Tickets</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Report faults, damaged equipment, or service issues. Track progress from OPEN through to RESOLVED.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            {showCreate ? "Cancel" : "+ New Ticket"}
          </button>
        </div>

        {/* Create ticket form */}
        {showCreate && (
          <section className="mt-6 rounded-[1.75rem] border border-indigo-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Create Incident Ticket</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTicket}>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Title</span>
                <input
                  required
                  name="title"
                  value={formState.title}
                  onChange={handleFormChange}
                  placeholder="Brief summary of the issue"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea
                  required
                  name="description"
                  value={formState.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Detailed description of the incident"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Category</span>
                <select
                  name="category"
                  value={formState.category}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Priority</span>
                <select
                  name="priority"
                  value={formState.priority}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                >
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Location / Room</span>
                <input
                  required
                  name="location"
                  value={formState.location}
                  onChange={handleFormChange}
                  placeholder="e.g. Lab 3, Block A"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Preferred Contact</span>
                <input
                  name="preferredContact"
                  value={formState.preferredContact}
                  onChange={handleFormChange}
                  placeholder="Phone / email (optional)"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Image Attachments (up to 3)
                </span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span>{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                  ))}
                  {files.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
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

              {formError && <p className="text-sm font-semibold text-red-600 md:col-span-2">{formError}</p>}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading tickets...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-center text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && tickets.length === 0 && (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-slate-500">
              No tickets yet. Create your first incident report above.
            </div>
          )}

          {tickets.map((ticket) => {
            const isOwner = user?.id === ticket.createdByUserId;
            const isOpen = expandedId === ticket.id;

            return (
              <article key={ticket.id} className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                {/* Ticket header — click to expand */}
                <button
                  type="button"
                  className="w-full text-left px-6 pt-6 pb-4"
                  onClick={() => setExpandedId(isOpen ? null : ticket.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[ticket.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {ticket.status?.replace("_", " ")}
                        </span>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${PRIORITY_COLORS[ticket.priority] ?? "bg-slate-100"}`}>
                          {ticket.priority}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-semibold text-slate-500">
                          {ticket.category}
                        </span>
                      </div>
                      <h2 className="mt-2 text-xl font-bold text-slate-900">{ticket.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {ticket.location}
                        {ticket.assignedToUserId && <span className="ml-3 text-indigo-600">Assigned: {ticket.assignedToUserId}</span>}
                      </p>
                    </div>
                    <span className="text-slate-400">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-5">
                    {/* Description */}
                    <p className="text-slate-700">{ticket.description}</p>

                    {ticket.preferredContact && (
                      <p className="text-sm text-slate-500">Contact: <span className="font-medium text-slate-700">{ticket.preferredContact}</span></p>
                    )}

                    {/* Resolution / Rejection notes */}
                    {ticket.resolutionNotes && (
                      <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                        <p className="text-sm font-bold text-green-800">Resolution Notes</p>
                        <p className="mt-1 text-sm text-green-700">{ticket.resolutionNotes}</p>
                      </div>
                    )}
                    {ticket.rejectionReason && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <p className="text-sm font-bold text-red-800">Rejection Reason</p>
                        <p className="mt-1 text-sm text-red-700">{ticket.rejectionReason}</p>
                      </div>
                    )}

                    {/* Attachments */}
                    {(ticket.imageAttachments?.length > 0 || (isOwner && ticket.imageAttachments?.length < 3)) && (
                      <div>
                        <p className="text-sm font-bold text-slate-700">Attachments</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {ticket.imageAttachments?.map((filename) => (
                            <div key={filename} className="group relative">
                              <img
                                src={ticketApi.getAttachmentUrl(ticket.id, filename)}
                                alt={filename}
                                className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                              />
                              {(isOwner || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(ticket.id, filename)}
                                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white group-hover:flex"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          {isOwner && ticket.imageAttachments?.length < 3 && (
                            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500">
                              +
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadMore(ticket.id, e)} />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Staff actions */}
                    {isElevated && (
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Update status:</span>
                          <select
                            value={ticket.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus === "REJECTED") {
                                setStatusModal({ ticketId: ticket.id, status: newStatus });
                                setStatusReason("");
                                setStatusNotes("");
                              } else if (newStatus === "RESOLVED") {
                                setStatusModal({ ticketId: ticket.id, status: newStatus });
                                setStatusReason("");
                                setStatusNotes("");
                              } else {
                                ticketApi.updateStatus(ticket.id, newStatus).then(loadTickets);
                              }
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          >
                            {STATUS_FLOW.map((s) => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>
                        </div>
                        {(isAdmin || user?.roles?.includes("MANAGER")) && (
                          <button
                            type="button"
                            onClick={() => { setAssignModal(ticket.id); setAssignUserId(ticket.assignedToUserId ?? ""); }}
                            className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            {ticket.assignedToUserId ? "Reassign" : "Assign Technician"}
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
                          className="text-sm font-semibold text-red-600 hover:text-red-800"
                        >
                          Delete Ticket
                        </button>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Comments ({ticket.comments?.length ?? 0})</p>
                      <div className="mt-3 space-y-3">
                        {ticket.comments?.length === 0 && (
                          <p className="text-sm text-slate-400">No comments yet.</p>
                        )}
                        {ticket.comments?.map((comment) => {
                          const isCommentOwner = user?.id === comment.authorUserId;
                          const isEditing = editingComment?.ticketId === ticket.id && editingComment?.commentId === comment.id;

                          return (
                            <div key={comment.id} className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-bold text-slate-800">{comment.authorName}</p>
                                <div className="flex gap-2">
                                  {isCommentOwner && !isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingComment({ ticketId: ticket.id, commentId: comment.id, value: comment.content })}
                                      className="text-xs font-semibold text-indigo-600 hover:underline"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {(isCommentOwner || isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(ticket.id, comment.id)}
                                      className="text-xs font-semibold text-red-500 hover:underline"
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
                                    onChange={(e) => setEditingComment((prev) => ({ ...prev, value: e.target.value }))}
                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  />
                                  <button type="button" onClick={() => saveEditComment(ticket.id, comment.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Save</button>
                                  <button type="button" onClick={() => setEditingComment(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Cancel</button>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm text-slate-600">{comment.content}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-col gap-2 md:flex-row">
                        <input
                          value={commentDrafts[ticket.id] ?? ""}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          placeholder="Add a comment..."
                          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm"
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(ticket.id); } }}
                        />
                        <button
                          type="button"
                          onClick={() => submitComment(ticket.id)}
                          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {statusModal.status === "REJECTED" ? "Reject Ticket" : "Mark as Resolved"}
            </h3>
            {statusModal.status === "REJECTED" && (
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-700">Rejection Reason</span>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="Explain why this ticket is being rejected..."
                />
              </label>
            )}
            {statusModal.status === "RESOLVED" && (
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-700">Resolution Notes</span>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  placeholder="Describe how the issue was resolved..."
                />
              </label>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setStatusModal(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${statusModal.status === "REJECTED" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Assign Technician</h3>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">User ID / Email of assignee</span>
              <input
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                placeholder="Enter technician user ID"
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setAssignModal(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={handleAssign} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
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

