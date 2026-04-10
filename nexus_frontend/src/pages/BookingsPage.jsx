import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { bookingApi } from "../services/api";
import { useAuth } from "../context/useAuth";
import BookingForm from "../components/bookings/BookingForm";
import BookingTable from "../components/bookings/BookingTable";
import AdminBookingDashboard from "../components/bookings/AdminBookingDashboard";

const BookingsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const selectedResource = location.state?.selectedResource;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(selectedResource ? "new" : "my"); // 'my' or 'admin' or 'new'

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingApi.list();
      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (selectedResource) {
      setActiveTab("new");
    }
  }, [selectedResource]);

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.some((role) => ["ADMIN", "MANAGER"].includes(role));

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-28 pb-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Space Management</p>
          <h1 className="mt-2 text-5xl font-black text-slate-900">Seamless Resource Booking.</h1>
          <p className="mt-4 mx-auto max-w-2xl text-slate-600">
            Reserve campus facilities, study pods, and equipment instantly. Monitor your reservation status and manage schedules in one place.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab("my")}
            className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
              activeTab === "my"
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            My Reservations
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
              activeTab === "new"
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            New Booking
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
                activeTab === "admin"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              Admin Dashboard
            </button>
          )}
        </div>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "new" && (
            <div className="max-w-2xl mx-auto">
              <BookingForm
                initialResource={selectedResource}
                onBookingCreated={() => {
                  loadBookings();
                  setActiveTab("my");
                }}
              />
            </div>
          )}

          {activeTab === "my" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Your Activity</h3>
                <button onClick={loadBookings} className="text-sm font-semibold text-blue-600 hover:underline">
                  Refresh List
                </button>
              </div>
              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading your bookings...</div>
              ) : (
                <BookingTable bookings={bookings} onUpdate={loadBookings} />
              )}
            </div>
          )}

          {activeTab === "admin" && isAdmin && (
            <AdminBookingDashboard bookings={bookings} onUpdate={loadBookings} />
          )}
        </section>
      </div>
    </main>
  );
};

export default BookingsPage;
