import { useState, useEffect } from "react";
import { bookingApi, resourceApi } from "../../services/api";
import {
  formatEnumLabel,
  formatTimeLabel,
  getResourceAvailabilityLabel,
  getResourceCapacityLabel,
  isSharedEquipmentResource,
} from "../resources/useResourcesModule.jsx";

const BookingForm = ({ initialResource, onBookingCreated }) => {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
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
        const [resourceResponse, bookingResponse] = await Promise.all([resourceApi.list(), bookingApi.availability()]);
        setResources(resourceResponse.data ?? []);
        setBookings(bookingResponse.data ?? []);
      } catch (err) {
        console.error("Failed to fetch booking resources", err);
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
    setError("");
  };

  const selectedResource = resources.find((resource) => resource.id === formData.resourceId);

  const isActiveBooking = (booking) => !["REJECTED", "CANCELLED"].includes(String(booking?.status ?? "").toUpperCase());

  const isMatchingResource = (booking, resource) =>
    (booking?.resourceId && booking.resourceId === resource?.id) ||
    String(booking?.resourceName ?? "").trim().toLowerCase() === String(resource?.name ?? "").trim().toLowerCase();

  const isOverlapping = (start1, end1, start2, end2) => start1 < end2 && end1 > start2;

  const overlappingBookings = selectedResource
    ? bookings.filter(
        (booking) =>
          isActiveBooking(booking) &&
          isMatchingResource(booking, selectedResource) &&
          String(booking?.date ?? "").slice(0, 10) === formData.date &&
          isOverlapping(formData.startTime, formData.endTime, String(booking?.startTime ?? "").slice(0, 5), String(booking?.endTime ?? "").slice(0, 5))
      )
    : [];

  const totalUnits = Math.max(Number(selectedResource?.capacity ?? 1), 1);
  const attendeeCount = Number(formData.attendees || 0);
  const availableUnits = isSharedEquipmentResource(selectedResource) ? Math.max(totalUnits - overlappingBookings.length, 0) : overlappingBookings.length > 0 ? 0 : 1;
  const hasTimeConflict = isSharedEquipmentResource(selectedResource)
    ? availableUnits === 0
    : overlappingBookings.length > 0;
  const exceedsSeatCapacity =
    selectedResource && selectedResource.type !== "EQUIPMENT" && attendeeCount > totalUnits;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedResource) {
      setLoading(false);
      setError("Please choose a valid resource before submitting.");
      return;
    }

    if (selectedResource.status !== "ACTIVE") {
      setLoading(false);
      setError("This resource is currently unavailable for booking.");
      return;
    }

    if (hasTimeConflict) {
      setLoading(false);
      setError(
        isSharedEquipmentResource(selectedResource)
          ? "All available units are already reserved for this time slot."
          : "This time slot is already booked for the selected resource."
      );
      return;
    }

    if (exceedsSeatCapacity) {
      setLoading(false);
      setError(`Attendee count exceeds the allowed capacity for ${selectedResource.name}.`);
      return;
    }

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
        <p className="mt-2 text-slate-500">Fill in the details to reserve your preferred resource with live capacity guidance.</p>
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
              <p className="text-slate-600">{formatEnumLabel(initialResource.type)}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Location</p>
              <p className="font-bold text-slate-900">{initialResource.location}</p>
            </div>
          </div>
        </div>
      )}

      {selectedResource && (
        <div className="mb-8 rounded-3xl border border-[#dbe7df] bg-[linear-gradient(135deg,rgba(16,60,53,0.04),rgba(242,212,92,0.12))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#39766a]">Capacity & Availability</p>
              <h4 className="mt-2 text-xl font-extrabold text-slate-900">{selectedResource.name}</h4>
              <p className="mt-1 text-sm font-semibold text-slate-600">{getResourceCapacityLabel(selectedResource)}</p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                hasTimeConflict
                  ? "bg-rose-100 text-rose-700"
                  : isSharedEquipmentResource(selectedResource) && overlappingBookings.length > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {hasTimeConflict
                ? "Fully Booked"
                : isSharedEquipmentResource(selectedResource) && overlappingBookings.length > 0
                  ? `${availableUnits} Units Left`
                  : "Available"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Booking Window</p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {formatTimeLabel(selectedResource.availableFrom)} - {formatTimeLabel(selectedResource.availableTo)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Current Slot Usage</p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {isSharedEquipmentResource(selectedResource)
                  ? `${overlappingBookings.length} reserved / ${totalUnits} units`
                  : overlappingBookings.length > 0
                    ? "Reserved"
                    : "Open"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Booking Rule</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{getResourceAvailabilityLabel(selectedResource)}</p>
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
                {resource.name} {resource.capacity ? `(${getResourceCapacityLabel(resource)})` : ""}
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
              placeholder={selectedResource?.type === "EQUIPMENT" ? "Requestor count" : "Enter attendee count"}
              value={formData.attendees}
              onChange={handleChange}
              required
              min="1"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/5"
            />
            {exceedsSeatCapacity && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                This resource supports up to {totalUnits} attendees for a single booking.
              </p>
            )}
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
            disabled={loading || hasTimeConflict || exceedsSeatCapacity}
            className="w-full rounded-2xl bg-[#07251f] py-4 font-bold text-white transition hover:bg-[#1b4332] disabled:opacity-50 shadow-lg shadow-[#07251f]/10"
          >
            {loading ? "Processing..." : hasTimeConflict || exceedsSeatCapacity ? "Slot Unavailable" : "Confirm Reservation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
