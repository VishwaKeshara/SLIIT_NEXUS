import { useEffect, useState, useMemo } from "react";
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

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const approved = bookings.filter((b) => b.status === "APPROVED").length;
    return { total, pending, approved };
  }, [bookings]);

  return (
    <main className="min-h-screen bg-[#f8faf9]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#07251f] pt-32 pb-24 text-white">
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            backgroundImage: "url('/sliit-campus-bg.jpeg')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07251f]/80 to-[#07251f]" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="inline-block rounded-full bg-[#1b4332] px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-[#b7e4c7]">
              Nexus Booking Center
            </p>
            <h1 className="font-display mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
              SLIIT <span className="text-[#408a71]">Nexus</span>.
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              From study pods to lecture halls, reserve everything you need for your academic success. 
              Track status, manage check-ins, and view history in your personal dashboard.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab("new")}
                className="rounded-full bg-[#408a71] px-8 py-4 font-bold text-white transition hover:bg-[#2d6e5f] shadow-lg shadow-[#408a71]/20"
              >
                Start New Booking
              </button>
              <button
                onClick={() => setActiveTab("my")}
                className="rounded-full border border-white/20 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-md transition hover:bg-white/10"
              >
                View My History
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section className="relative -mt-12 z-10 mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-white bg-white p-8 shadow-xl shadow-slate-200/50">
            <p className="text-sm font-bold uppercase tracking-widest text-[#408a71]">Total Requests</p>
            <h3 className="font-display mt-2 text-4xl font-black text-slate-900">{stats.total}</h3>
            <div className="mt-4 h-1 w-12 rounded-full bg-[#408a71]/20" />
          </div>
          <div className="rounded-3xl border border-white bg-white p-8 shadow-xl shadow-slate-200/50">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-600">Pending Approval</p>
            <h3 className="font-display mt-2 text-4xl font-black text-slate-900">{stats.pending}</h3>
            <div className="mt-4 h-1 w-12 rounded-full bg-amber-600/20" />
          </div>
          <div className="rounded-3xl border border-white bg-white p-8 shadow-xl shadow-slate-200/50">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Active Bookings</p>
            <h3 className="font-display mt-2 text-4xl font-black text-slate-900">{stats.approved}</h3>
            <div className="mt-4 h-1 w-12 rounded-full bg-emerald-600/20" />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-24">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-slate-900">
              {activeTab === "my" ? "Your Reservation History" : activeTab === "new" ? "Create a New Request" : "Admin Control Center"}
            </h2>
            <p className="mt-1 text-slate-500">
              {activeTab === "my" ? "Review and manage your personal bookings." : "Fill out the form below to reserve a campus resource."}
            </p>
          </div>
          
          <div className="flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab("my")}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${
                activeTab === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab("new")}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${
                activeTab === "new" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              New Booking
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${
                  activeTab === "admin" ? "bg-white text-[#408a71] shadow-sm" : "text-slate-500 hover:text-[#408a71]"
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "new" && (
            <div className="mx-auto max-w-2xl">
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
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Live Activity
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                </h3>
                <button 
                  onClick={loadBookings} 
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 border border-slate-200"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-[2rem] border border-dashed border-slate-200 bg-white p-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#408a71] border-t-transparent" />
                  <p className="font-bold text-slate-400 text-lg">Fetching your bookings...</p>
                </div>
              ) : (
                <BookingTable bookings={bookings} onUpdate={loadBookings} />
              )}
            </div>
          )}

          {activeTab === "admin" && isAdmin && (
            <AdminBookingDashboard bookings={bookings} onUpdate={loadBookings} />
          )}
        </div>
      </section>
    </main>
  );
};

// Simple Refresh Icon component
const RefreshCwIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21v-5h5" />
  </svg>
);

export default BookingsPage;
