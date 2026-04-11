import { useState } from "react";
import { bookingApi } from "../../services/api";

const AdminBookingDashboard = ({ bookings, onUpdate }) => {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredBookings = bookings.filter((b) => filterStatus === "ALL" || b.status === filterStatus);

  const handleApprove = async (id) => {
    try {
      await bookingApi.approve(id);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Failed to approve booking.");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookingApi.reject(rejectId, rejectReason);
      setRejectId(null);
      setRejectReason("");
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Failed to reject booking.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking record permanently?")) return;
    try {
      await bookingApi.delete(id);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Failed to delete booking.");
    }
  };

  const statusColors = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
    CANCELLED: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Resource Reservations</h3>
          <p className="text-sm text-slate-500">Review and moderate all booking requests across campus.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500">No bookings match your filter.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <article key={booking.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{booking.date}</span>
                  </div>
                  <h4 className="mt-2 text-xl font-bold text-slate-900">{booking.resourceName}</h4>
                  <p className="text-sm font-medium text-slate-600">Requested by: {booking.userName || booking.userId}</p>
                  <p className="mt-2 text-slate-600 text-sm">
                    <span className="font-semibold">Purpose:</span> {booking.purpose}
                  </p>
                  <div className="mt-3 flex gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>🕒 {booking.startTime} - {booking.endTime}</span>
                    <span>👥 {booking.attendees} Attendees</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {booking.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectId(booking.id)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {booking.status !== "PENDING" && (
                     <button
                        onClick={() => handleDelete(booking.id)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-400 hover:text-rose-600 hover:border-rose-200 transition"
                      >
                        Delete Record
                      </button>
                  )}
                </div>
              </div>

              {rejectId === booking.id && (
                <form onSubmit={handleRejectSubmit} className="mt-6 rounded-2xl bg-rose-50 p-4 border border-rose-100">
                  <label className="block text-sm font-bold text-rose-900 mb-2">Rejection Reason</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Venue under maintenance"
                      className="flex-1 rounded-xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-400"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-rose-600 px-6 py-2 font-bold text-white hover:bg-rose-700"
                    >
                      Confirm Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId(null)}
                      className="rounded-xl bg-white border border-rose-200 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              {booking.rejectionReason && (
                <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 border border-rose-100">
                  <span className="font-bold">Rejection Reason:</span> {booking.rejectionReason}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBookingDashboard;
