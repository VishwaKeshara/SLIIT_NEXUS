import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { bookingApi } from "../../services/api";

const BookingTable = ({ bookings, onUpdate }) => {
  const [viewingQr, setViewingQr] = useState(null); // stores booking object
  const [loadingQr, setLoadingQr] = useState(false);

  const handleViewQr = async (booking) => {
    setLoadingQr(booking.id);
    try {
      // Fetch fresh booking detail for the most up-to-date info
      const response = await bookingApi.getById(booking.id);
      setViewingQr(response.data);
    } catch {
      // Fallback: use the booking data we already have if fetch fails
      setViewingQr(booking);
    } finally {
      setLoadingQr(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "CANCELLED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await bookingApi.cancel(id);
      if (onUpdate) onUpdate();
    } catch {
      alert("Failed to cancel booking.");
    }
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-12 text-center">
        <p className="text-slate-500">You don't have any bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Resource</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-slate-900">{booking.resourceName}</p>
                <p className="text-sm text-slate-500">{booking.purpose}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-slate-700">{booking.date}</p>
                <p className="text-sm text-slate-500">
                  {booking.startTime} - {booking.endTime}
                </p>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusStyle(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
                {booking.rejectionReason && (
                  <p className="mt-1 text-[10px] text-rose-600 font-medium">Reason: {booking.rejectionReason}</p>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-3">
                  {booking.status === "APPROVED" && (
                    <button
                      onClick={() => handleViewQr(booking)}
                      disabled={loadingQr === booking.id}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                    >
                      {loadingQr === booking.id ? "Loading..." : "View QR"}
                    </button>
                  )}
                  {booking.status === "APPROVED" ? (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition"
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-sm text-slate-400">---</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewingQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">Check-in QR Code</h3>
              <p className="mt-2 text-slate-500">Show this code at the venue entry.</p>
              
              <div className="mt-8 flex justify-center overflow-hidden rounded-3xl border-4 border-slate-100 bg-white p-4">
                <QRCodeCanvas
                  value={`ID:${viewingQr.id}|Res:${viewingQr.resourceName}|Date:${viewingQr.date}|Time:${viewingQr.startTime}`}
                  size={256}
                  level={"H"}
                  includeMargin={false}
                />
              </div>

              <div className="mt-8 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-sm">
                <p className="font-bold text-slate-900">{viewingQr.resourceName}</p>
                <p className="text-slate-600">{viewingQr.date} @ {viewingQr.startTime}</p>
                <div className="pt-2 border-t border-slate-200 mt-2">
                   <p className="text-[10px] uppercase font-bold text-slate-400">Scan URL hint:</p>
                   <p className="text-[10px] text-blue-500 break-all">{window.location.origin}/checkin/{viewingQr.id}</p>
                </div>
              </div>

              <button
                onClick={() => setViewingQr(null)}
                className="mt-8 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white transition hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingTable;
