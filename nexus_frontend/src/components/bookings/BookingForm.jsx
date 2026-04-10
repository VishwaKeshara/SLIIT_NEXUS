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

    // Find the selected resource to get its name
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
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">New Booking Request</h3>
      <p className="text-sm text-slate-500 mb-6">Select a resource and time slot to place your reservation.</p>

      {initialResource && (
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Selected Resource</p>
          <div className="mt-3 grid gap-3 text-sm text-emerald-900 md:grid-cols-2">
            <p>
              <span className="font-bold">Name:</span> {initialResource.name}
            </p>
            <p>
              <span className="font-bold">Type:</span> {initialResource.type}
            </p>
            <p>
              <span className="font-bold">Location:</span> {initialResource.location}
            </p>
            <p>
              <span className="font-bold">Available:</span> {initialResource.availableFrom || "N/A"} -{" "}
              {initialResource.availableTo || "N/A"}
            </p>
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-700">
            Resource details were filled from availability. You can still edit date, time, purpose, and attendees.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Resource</label>
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Choose Resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} {resource.capacity ? `(Capacity: ${resource.capacity})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">End Time</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Purpose</label>
          <input
            type="text"
            name="purpose"
            placeholder="e.g. Project Meeting"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Number of Attendees</label>
          <input
            type="number"
            name="attendees"
            placeholder="0"
            value={formData.attendees}
            onChange={handleChange}
            required
            min="1"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2 pt-4">
          {error && <p className="mb-4 text-sm font-medium text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-4 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Submit Reservation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
