import { useEffect, useState } from "react";
import { ticketApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const statusOptions = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const TicketsPage = () => {
  const { user, refreshAuth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});

  const loadTickets = async () => {
    const { data } = await ticketApi.list();
    setTickets(data);
    await refreshAuth();
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const canManageStatus = user?.roles.some((role) => ["ADMIN", "MANAGER", "TECHNICIAN"].includes(role));

  const updateStatus = async (ticketId, status) => {
    await ticketApi.updateStatus(ticketId, status);
    await loadTickets();
  };

  const submitComment = async (ticketId) => {
    const content = commentDrafts[ticketId]?.trim();
    if (!content) {
      return;
    }
    await ticketApi.addComment(ticketId, content);
    setCommentDrafts((current) => ({ ...current, [ticketId]: "" }));
    await loadTickets();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 pt-28">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Support workflow</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Ticket status changes and comments notify users.</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Support staff can progress ticket status, and any new comment from someone other than the requester
            creates a notification for the ticket owner.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ticket.status}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{ticket.title}</h2>
                  <p className="mt-2 text-slate-600">{ticket.description}</p>
                </div>

                {canManageStatus && (
                  <select
                    value={ticket.status}
                    onChange={(event) => updateStatus(ticket.id, event.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-2"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Comments</p>
                <div className="mt-3 space-y-3">
                  {ticket.comments.length === 0 && (
                    <p className="text-sm text-slate-500">No comments yet.</p>
                  )}
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-900">{comment.authorName}</p>
                      <p className="mt-1 text-slate-600">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <input
                    value={commentDrafts[ticket.id] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [ticket.id]: event.target.value,
                      }))
                    }
                    placeholder="Add a new comment"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
                  />
                  <button
                    type="button"
                    onClick={() => submitComment(ticket.id)}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
                  >
                    Post comment
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default TicketsPage;
