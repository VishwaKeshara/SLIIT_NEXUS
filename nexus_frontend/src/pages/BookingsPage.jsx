import { useEffect, useState } from "react";
import { bookingApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const BookingsPage = () => {
  const { user, refreshAuth } = useAuth();
  const [bookings, setBookings] = useState([]);

  const loadBookings = async () => {
    const { data } = await bookingApi.list();
    setBookings(data);
    await refreshAuth();
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const canModerate = user?.roles.some((role) => ["ADMIN", "MANAGER"].includes(role));

  const updateStatus = async (bookingId, status) => {
    await bookingApi.updateStatus(bookingId, status);
    await loadBookings();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Notifications demo</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Booking decisions trigger user alerts.</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              When admins or managers approve or reject a booking, the requester receives a notification in the
              panel at the top of the app.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{booking.status}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{booking.resourceName}</h2>
                  <p className="mt-1 text-slate-600">{booking.dateLabel}</p>
                  <p className="mt-3 text-sm text-slate-500">Requested by user ID: {booking.requestedByUserId}</p>
                </div>

                {canModerate && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateStatus(booking.id, "APPROVED")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(booking.id, "REJECTED")}
                      className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default BookingsPage;
