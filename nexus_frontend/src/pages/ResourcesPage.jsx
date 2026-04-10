import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { bookingApi, resourceApi } from "../services/api";

const resourceTypes = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const resourceStatuses = ["ACTIVE", "OUT_OF_SERVICE"];
const calendarSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const campusLocations = {
  LECTURE_HALL: [
    "Main Building - Lecture Hall A",
    "Main Building - Lecture Hall B",
    "Main Building - Lecture Hall C",
    "Engineering Block - Hall 1",
    "Business Faculty - Hall 2",
  ],
  LAB: [
    "Computing Block - Lab 1",
    "Computing Block - Lab 2",
    "Computing Block - Lab 3",
    "Engineering Block - Hardware Lab",
    "Science Block - Network Lab",
  ],
  MEETING_ROOM: [
    "Administration Block - Meeting Room 1",
    "Administration Block - Meeting Room 2",
    "Library Building - Discussion Room",
    "Research Center - Conference Room",
  ],
  EQUIPMENT: [
    "Media Unit - Asset Room",
    "Main Building - Equipment Store",
    "Engineering Block - AV Store",
    "Media Unit - Camera Store",
    "Communication Office - Equipment Desk",
    "Main Building - Asset Room",
  ],
};

const emptyResourceForm = {
  name: "",
  type: "",
  capacity: "",
  location: "",
  availableFrom: "",
  availableTo: "",
  status: "",
  description: "",
};

const initialFilters = {
  search: "",
  type: "",
  capacity: "",
  location: "",
  status: "",
};

const formatEnumLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "";

const formatTimeLabel = (timeValue) =>
  timeValue
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(`1970-01-01T${timeValue}`))
    : "N/A";

const formatCalendarDay = (date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

const toDateKey = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getAllLocations = () => [...new Set(Object.values(campusLocations).flat())];

const getFriendlyResourceError = (err) => {
  const message = err?.response?.data?.message;
  if (message) {
    return message;
  }

  if (err?.response?.status === 403) {
    return "Only admin users can create, update, or delete resources.";
  }

  if (!err?.response) {
    return "Cannot reach the backend server. Please start the backend and try again.";
  }

  return "Something went wrong while saving the resource. Please try again.";
};

const ResourcesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");

  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");
  const [formState, setFormState] = useState(emptyResourceForm);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [availabilityResource, setAvailabilityResource] = useState(null);

  const loadResources = async () => {
    setLoading(true);
    setCatalogueError("");

    try {
      const { data } = await resourceApi.list();
      setResources(data ?? []);
    } catch {
      setResources([]);
      setCatalogueError("Unable to load the facilities catalogue right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) {
        setBookings([]);
        return;
      }

      try {
        const { data } = await bookingApi.list();
        setBookings(data ?? []);
      } catch {
        setBookings([]);
      }
    };

    void loadBookings();
  }, [user]);

  const calendarDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date();
        day.setDate(day.getDate() + index);
        return day;
      }),
    []
  );

  const formLocationOptions = formState.type ? campusLocations[formState.type] ?? [] : [];
  const filterLocationOptions = filters.type ? campusLocations[filters.type] ?? [] : getAllLocations();

  const filteredResources = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const minCapacity = filters.capacity === "" ? null : Number(filters.capacity);

    return resources.filter((resource) => {
      const matchesSearch =
        normalizedSearch === "" ||
        resource.name?.toLowerCase().includes(normalizedSearch) ||
        resource.location?.toLowerCase().includes(normalizedSearch) ||
        resource.description?.toLowerCase().includes(normalizedSearch);

      const matchesType = filters.type === "" || resource.type === filters.type;
      const matchesCapacity = minCapacity === null || (resource.capacity ?? 0) >= minCapacity;
      const matchesLocation = filters.location === "" || resource.location === filters.location;
      const matchesStatus = filters.status === "" || resource.status === filters.status;

      return matchesSearch && matchesType && matchesCapacity && matchesLocation && matchesStatus;
    });
  }, [filters, resources]);

  const summary = useMemo(
    () => ({
      total: resources.length,
      active: resources.filter((resource) => resource.status === "ACTIVE").length,
      outOfService: resources.filter((resource) => resource.status === "OUT_OF_SERVICE").length,
      filtered: filteredResources.length,
    }),
    [filteredResources.length, resources]
  );

  const validateForm = () => {
    const nextErrors = {};
    const name = formState.name.trim();
    const capacity = Number(formState.capacity);

    if (!name) {
      nextErrors.name = "Resource name is required.";
    } else if (name.length < 3) {
      nextErrors.name = "Resource name must be at least 3 characters.";
    } else if (name.length > 80) {
      nextErrors.name = "Resource name cannot exceed 80 characters.";
    }

    if (!formState.type) {
      nextErrors.type = "Resource type is required.";
    }

    if (formState.capacity === "") {
      nextErrors.capacity = "Capacity is required.";
    } else if (!Number.isInteger(capacity) || capacity < 1) {
      nextErrors.capacity = "Capacity must be a whole number greater than 0.";
    } else if (capacity > 500) {
      nextErrors.capacity = "Capacity cannot exceed 500.";
    }

    if (!formState.location) {
      nextErrors.location = "Campus location is required.";
    }

    if (!formState.availableFrom) {
      nextErrors.availableFrom = "Available from time is required.";
    }

    if (!formState.availableTo) {
      nextErrors.availableTo = "Available to time is required.";
    }

    if (formState.availableFrom && formState.availableTo && formState.availableFrom >= formState.availableTo) {
      nextErrors.availableTo = "Available to time must be later than available from time.";
    }

    if (!formState.status) {
      nextErrors.status = "Status is required.";
    }

    if (formState.description.trim().length > 240) {
      nextErrors.description = "Description cannot exceed 240 characters.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormState((current) => {
      if (name === "type") {
        return { ...current, type: value, location: "" };
      }

      return { ...current, [name]: value };
    });

    setFormErrors((current) => ({ ...current, [name]: "" }));
    setFormMessage("");
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => {
      if (name === "type") {
        return { ...current, type: value, location: "" };
      }

      return { ...current, [name]: value };
    });
  };

  const resetForm = () => {
    setFormState(emptyResourceForm);
    setFormErrors({});
    setFormMessage("");
    setEditingId(null);
  };

  const startEdit = (resource) => {
    setEditingId(resource.id);
    setFormState({
      name: resource.name ?? "",
      type: resource.type ?? "",
      capacity: resource.capacity?.toString() ?? "",
      location: resource.location ?? "",
      availableFrom: resource.availableFrom ?? "",
      availableTo: resource.availableTo ?? "",
      status: resource.status ?? "",
      description: resource.description ?? "",
    });
    setFormErrors({});
    setFormMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormMessage("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      ...formState,
      name: formState.name.trim(),
      capacity: Number(formState.capacity),
      description: formState.description.trim(),
    };

    setSubmitting(true);

    try {
      if (editingId) {
        await resourceApi.update(editingId, payload);
        setFormMessage("Resource updated successfully.");
      } else {
        await resourceApi.create(payload);
        setFormMessage("Resource added successfully.");
      }

      resetForm();
      await loadResources();
    } catch (err) {
      setFormMessage(getFriendlyResourceError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteResource = async (resource) => {
    const confirmed = window.confirm(`Delete "${resource.name}" from the catalogue?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(resource.id);
    setFormMessage("");

    try {
      await resourceApi.remove(resource.id);
      if (editingId === resource.id) {
        resetForm();
      }
      await loadResources();
    } catch (err) {
      setFormMessage(getFriendlyResourceError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const getSlotStatus = (resource, day, slot) => {
    if (resource.status === "OUT_OF_SERVICE") {
      return "Out of Service";
    }

    const isInsideAvailability =
      resource.availableFrom && resource.availableTo && slot >= resource.availableFrom && slot < resource.availableTo;

    if (!isInsideAvailability) {
      return "Out of Service";
    }

    const dayKey = toDateKey(day);
    const slotLabel = formatTimeLabel(slot);
    const isBooked = bookings.some(
      (booking) =>
        booking.status === "APPROVED" &&
        booking.resourceName === resource.name &&
        booking.dateLabel?.includes(dayKey) &&
        booking.dateLabel?.includes(slotLabel)
    );

    return isBooked ? "Booked" : "Available";
  };

  const getSlotClass = (status) => {
    if (status === "Available") {
      return "border-green-200 bg-green-50 text-green-800";
    }

    if (status === "Booked") {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }

    return "border-red-200 bg-red-50 text-red-800";
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_45%,#eef7f3_100%)] px-4 pb-16 pt-28">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] p-8 text-center text-white shadow-[0_24px_70px_rgba(30,58,138,0.22)]">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfdbfe]">Module A</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Smart Campus Operations Hub
          </h1>
          <p className="mt-3 text-base font-semibold text-[#dbeafe]">Facilities & Assets Catalogue</p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-bold text-[#1e3a8a]">Total Resources</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-[#0f172a]">{summary.total}</p>
          </div>
          <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-bold text-[#166534]">Active</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-[#0f172a]">{summary.active}</p>
          </div>
          <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-bold text-[#991b1b]">Out of Service</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-[#0f172a]">{summary.outOfService}</p>
          </div>
          <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-bold text-[#475569]">Filtered Results</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-[#0f172a]">{summary.filtered}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.7fr]">
          {isAdmin && (
            <section className="rounded-[1.7rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563eb]">Admin Tool</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#1e3a8a]">
                    {editingId ? "Edit Resource" : "Add Resource"}
                  </h2>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Resource Name</span>
                  <input
                    name="name"
                    value={formState.name}
                    onChange={handleFormChange}
                    placeholder="Enter resource name"
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                      formErrors.name ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  {formErrors.name && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.name}</p>}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Resource Type</span>
                    <select
                      name="type"
                      value={formState.type}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.type ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    >
                      <option value="">Select type</option>
                      {resourceTypes.map((type) => (
                        <option key={type} value={type}>
                          {formatEnumLabel(type)}
                        </option>
                      ))}
                    </select>
                    {formErrors.type && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.type}</p>}
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Capacity</span>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      value={formState.capacity}
                      onChange={handleFormChange}
                      placeholder="Enter capacity"
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.capacity ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.capacity && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.capacity}</p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Campus Location</span>
                  <select
                    name="location"
                    value={formState.location}
                    onChange={handleFormChange}
                    disabled={!formState.type}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 ${
                      formErrors.location ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  >
                    <option value="">{formState.type ? "Select campus location" : "Select resource type first"}</option>
                    {formLocationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {formErrors.location && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.location}</p>
                  )}
                  <p className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
                    Location list updates automatically based on the selected resource type.
                  </p>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Available From</span>
                    <input
                      name="availableFrom"
                      type="time"
                      value={formState.availableFrom}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.availableFrom ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.availableFrom && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableFrom}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Available To</span>
                    <input
                      name="availableTo"
                      type="time"
                      value={formState.availableTo}
                      onChange={handleFormChange}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                        formErrors.availableTo ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.availableTo && (
                      <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableTo}</p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Status</span>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleFormChange}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                      formErrors.status ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  >
                    <option value="">Select status</option>
                    {resourceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {formErrors.status && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.status}</p>}
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Description</span>
                  <textarea
                    name="description"
                    rows="3"
                    value={formState.description}
                    onChange={handleFormChange}
                    placeholder="Enter short description"
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 ${
                      formErrors.description ? "border-red-400" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.description}</p>
                  )}
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Resource" : "Save Resource"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl bg-slate-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                  >
                    Clear
                  </button>
                </div>

                {formMessage && (
                  <p
                    className={`rounded-xl px-4 py-3 text-sm font-bold ${
                      formMessage.toLowerCase().includes("success")
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {formMessage}
                  </p>
                )}

                <p className="text-sm leading-6 text-slate-600">
                  This version uses predefined campus locations instead of manual typing.
                </p>
              </form>
            </section>
          )}

          <section className={`rounded-[1.7rem] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${isAdmin ? "" : "xl:col-span-2"}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563eb]">Catalogue</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#1e3a8a]">
                  Resource Catalogue
                </h2>
              </div>
              <button
                type="button"
                onClick={loadResources}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                name="search"
                type="text"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or location..."
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 xl:col-span-2"
              />

              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Types</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>

              <input
                name="capacity"
                type="number"
                min="1"
                value={filters.capacity}
                onChange={handleFilterChange}
                placeholder="Min Capacity"
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Status</option>
                {resourceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2 xl:col-span-5"
              >
                <option value="">All Locations</option>
                {filterLocationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl bg-slate-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Reset Filters
              </button>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-8 text-center font-semibold text-slate-500">
                  Loading resources...
                </div>
              ) : catalogueError ? (
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 p-8 text-center font-semibold text-red-700">
                  {catalogueError}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-8 text-center font-semibold text-slate-500">
                  No resources found.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredResources.map((resource) => (
                    <article
                      key={resource.id}
                      className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-900">
                            {resource.name}
                          </h3>
                          <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                            {formatEnumLabel(resource.type)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                            resource.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {resource.status}
                        </span>
                      </div>

                      <div className="mt-5 space-y-2 text-sm text-slate-700">
                        <p>
                          <span className="font-bold text-slate-900">Capacity:</span> {resource.capacity}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900">Location:</span> {resource.location}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900">Availability:</span>{" "}
                          {formatTimeLabel(resource.availableFrom)} - {formatTimeLabel(resource.availableTo)}
                        </p>
                        <p>
                          <span className="font-bold text-slate-900">Description:</span>{" "}
                          {resource.description || "N/A"}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setAvailabilityResource(resource)}
                          className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1d4ed8]"
                        >
                          View Availability
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(resource)}
                            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteResource(resource)}
                            disabled={deletingId === resource.id}
                            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === resource.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {availabilityResource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] p-6 text-white">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
                  Resource Availability Calendar
                </p>
                <h2 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.04em]">
                  {availabilityResource.name}
                </h2>
                <p className="mt-2 text-sm font-semibold text-blue-100">
                  {formatEnumLabel(availabilityResource.type)} | {availabilityResource.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailabilityResource(null)}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-[#1e3a8a] transition hover:bg-blue-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-132px)] overflow-y-auto p-6">
              {availabilityResource.status === "OUT_OF_SERVICE" && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                  This resource is currently OUT_OF_SERVICE. All calendar slots are blocked until the status changes.
                </div>
              )}

              <div className="mb-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                  Available
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
                  Booked
                </span>
                <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800">
                  Out of Service
                </span>
              </div>

              <div className="overflow-x-auto rounded-[1.4rem] border border-slate-200">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[120px_repeat(7,1fr)] bg-slate-100">
                    <div className="border-r border-slate-200 p-3 text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                      Time
                    </div>
                    {calendarDays.map((day) => (
                      <div
                        key={toDateKey(day)}
                        className="border-r border-slate-200 p-3 text-center text-sm font-black text-slate-700 last:border-r-0"
                      >
                        {formatCalendarDay(day)}
                      </div>
                    ))}
                  </div>

                  {calendarSlots.map((slot) => (
                    <div key={slot} className="grid grid-cols-[120px_repeat(7,1fr)] border-t border-slate-200">
                      <div className="border-r border-slate-200 bg-slate-50 p-3 text-sm font-extrabold text-slate-700">
                        {formatTimeLabel(slot)}
                      </div>
                      {calendarDays.map((day) => {
                        const status = getSlotStatus(availabilityResource, day, slot);

                        return (
                          <div key={`${toDateKey(day)}-${slot}`} className="border-r border-slate-200 p-2 last:border-r-0">
                            <div className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${getSlotClass(status)}`}>
                              {status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Booked slots are matched from approved booking records for this resource. Other slots follow the
                resource availability window.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default ResourcesPage;
