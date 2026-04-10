import { useState, useEffect } from "react";
import { bookingApi, resourceApi } from "../../services/api";

const BookingForm = ({ initialResource, onBookingCreated }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    resourceId: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: "",
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await resourceApi.list();
        setResources(response.data);
      } catch (err) {
        console.error("Failed to fetch resources", err);
      }
    };
    fetchResources();
  }, []);

  useEffect(() => {
    if (!initialResource) {
      return;
    }

    setFormData((current) => ({
      ...current,
      resourceId: initialResource.id ?? "",
      date: initialResource.date ?? current.date,
      startTime: initialResource.startTime ?? current.startTime,
      endTime: initialResource.endTime ?? current.endTime,
    }));
  }, [initialResource]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const selectedResource = resources.find((r) => r.id === formData.resourceId);

    try {
      await bookingApi.create({
        ...formData,
        resourceName: selectedResource?.name || "Unknown Resource",
        attendees: parseInt(formData.attendees) || 0,
      });
      setFormData({
        resourceId: "",
        date: "",
        startTime: "",
        endTime: "",
        purpose: "",
        attendees: "",
      });
      if (onBookingCreated) onBookingCreated();
      alert("Booking request submitted successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create booking. Please check for overlaps.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50">
      <div className="mb-8">
        <h3 className="font-display text-2xl font-bold text-slate-900">New Booking Request</h3>
        <p className="mt-2 text-slate-500">Fill in the details to reserve your preferred resource.</p>
      </div>

      {initialResource && (
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-widest">Resource Pre-selected</p>
          </div>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{initialResource.name}</p>
              <p className="text-slate-600">{initialResource.type?.replace("_", " ")}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Location</p>
              <p className="font-bold text-slate-900">{initialResource.location}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Select Resource</label>
          <select
            name="resourceId"
            value={formData.resourceId}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
          >
            <option value="">Choose a Facility</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} {resource.capacity ? `(Cap: ${resource.capacity})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Attendees</label>
            <input
              type="number"
              name="attendees"
              placeholder="0"
              value={formData.attendees}
              onChange={handleChange}
              required
              min="1"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Purpose of Reservation</label>
          <input
            type="text"
            name="purpose"
            placeholder="e.g. Study Group Session"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
          />
        </div>

        <div className="pt-6">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 border border-rose-100">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#07251f] py-4 font-bold text-white transition hover:bg-[#1b4332] disabled:opacity-50 shadow-lg shadow-[#07251f]/10"
          >
            {loading ? "Processing..." : "Confirm Reservation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
