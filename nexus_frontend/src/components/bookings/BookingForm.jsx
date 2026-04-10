import { useState, useEffect } from "react";
import { bookingApi } from "../../services/api";

const BookingForm = ({ onBookingCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    resourceType: "",
    resourceDetail: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Combine resourceType and resourceDetail for transmission
    const combinedResourceName = `${formData.resourceType} - ${formData.resourceDetail}`;

    try {
      await bookingApi.create({
        ...formData,
        resourceName: combinedResourceName,
        resourceId: formData.resourceType, // Using type as ID for now
        attendees: parseInt(formData.attendees) || 0,
      });
      setFormData({
        resourceType: "",
        resourceDetail: "",
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

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 md:col-span-2 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Resource</label>
            <select
              name="resourceType"
              value={formData.resourceType}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Choose Resource Type</option>
              <option value="Lecture Halls">Lecture Halls</option>
              <option value="Labs">Labs</option>
              <option value="Meeting Rooms">Meeting Rooms</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.resourceType && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="text-sm font-semibold text-slate-700">
                {formData.resourceType === "Lecture Halls" && "Lecture Hall Number"}
                {formData.resourceType === "Labs" && "Lab Number"}
                {formData.resourceType === "Meeting Rooms" && "Meeting Room Number"}
                {formData.resourceType === "Equipment" && "Equipment Name / ID"}
                {formData.resourceType === "Other" && "Specify Resource"}
              </label>
              <input
                type="text"
                name="resourceDetail"
                value={formData.resourceDetail}
                onChange={handleChange}
                required
                placeholder={
                  formData.resourceType === "Lecture Halls" ? "e.g. LH-01" :
                  formData.resourceType === "Labs" ? "e.g. LAB-02" :
                  formData.resourceType === "Meeting Rooms" ? "e.g. MR-03" :
                  formData.resourceType === "Equipment" ? "e.g. Projector-01" :
                  "Enter resource name"
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          )}
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
