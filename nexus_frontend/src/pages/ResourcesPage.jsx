<<<<<<< ours
const resourceCategories = [
  {
    title: "Study Spaces",
    description: "Reserve collaborative rooms, quiet pods, and presentation-ready venues across campus.",
    meta: "Labs, meeting rooms, auditoriums",
  },
  {
    title: "Equipment Pool",
    description: "Track shared assets for classes and events, from projectors to media kits and loaner devices.",
    meta: "AV gear, laptops, peripherals",
  },
  {
    title: "Student Services",
    description: "Find operational counters, support desks, and service windows available through Nexus.",
    meta: "Service points and operating hours",
  },
];

const ResourcesPage = () => (
  <main className="min-h-screen bg-slate-50 px-4 pt-28">
    <div className="mx-auto max-w-6xl">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Campus resources</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Everything available to book, borrow, or locate.</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Use this space as the starting point for facilities, equipment, and shared services that authenticated
          users can access through SLIIT Nexus.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {resourceCategories.map((resource) => (
          <article key={resource.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{resource.meta}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{resource.title}</h2>
            <p className="mt-3 text-slate-600">{resource.description}</p>
          </article>
        ))}
      </div>
    </div>
  </main>
);
=======
import { useEffect, useMemo, useState } from "react";
import { resourceApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const resourceTypeOptions = ["ALL", "LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const resourceStatusOptions = ["ALL", "ACTIVE", "OUT_OF_SERVICE"];

const createInitialForm = () => ({
  name: "",
  type: "LECTURE_HALL",
  capacity: "",
  location: "",
  availableFrom: "08:00",
  availableTo: "17:00",
  status: "ACTIVE",
  description: "",
});

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

const ResourcesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");

  const [resources, setResources] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState(createInitialForm());
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  const loadResources = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await resourceApi.list();
      setResources(data ?? []);
    } catch {
      setError("Unable to load the facilities catalogue right now.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const locationOptions = useMemo(() => {
    const locations = [...new Set(resources.map((resource) => resource.location).filter(Boolean))];
    return ["ALL", ...locations];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const capacityThreshold = minimumCapacity === "" ? null : Number(minimumCapacity);

    return resources.filter((resource) => {
      const matchesSearch =
        normalizedSearch === "" ||
        resource.name?.toLowerCase().includes(normalizedSearch) ||
        resource.location?.toLowerCase().includes(normalizedSearch) ||
        resource.description?.toLowerCase().includes(normalizedSearch);

      const matchesType = selectedType === "ALL" || resource.type === selectedType;
      const matchesStatus = selectedStatus === "ALL" || resource.status === selectedStatus;
      const matchesLocation = selectedLocation === "ALL" || resource.location === selectedLocation;
      const matchesCapacity = capacityThreshold === null || (resource.capacity ?? 0) >= capacityThreshold;

      return matchesSearch && matchesType && matchesStatus && matchesLocation && matchesCapacity;
    });
  }, [minimumCapacity, resources, searchText, selectedLocation, selectedStatus, selectedType]);

  const summary = useMemo(
    () => ({
      total: resources.length,
      active: resources.filter((resource) => resource.status === "ACTIVE").length,
      outOfService: resources.filter((resource) => resource.status === "OUT_OF_SERVICE").length,
      filtered: filteredResources.length,
    }),
    [filteredResources.length, resources]
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleCreateResource = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage("");

    try {
      await resourceApi.create({
        ...formState,
        capacity: Number(formState.capacity),
      });

      setFormState(createInitialForm());
      setFormMessage("Resource created successfully.");
      await loadResources();
    } catch {
      setFormMessage("Failed to create the resource. Please check the values and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3fbf8_0%,#eef7f3_100%)] px-4 pb-16 pt-28">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[#b9ddd2] bg-[linear-gradient(135deg,#0b3a34,#19584c_60%,#2d7f6b)] p-8 text-white shadow-[0_24px_70px_rgba(6,35,33,0.16)]">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfe8db]">Module A</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Facilities & Assets Catalogue
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#e1f3ec] sm:text-lg">
            Browse lecture halls, labs, meeting rooms, and equipment with searchable metadata including
            type, capacity, location, availability window, and operational status.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">Total Resources</p>
              <p className="mt-2 font-display text-4xl font-extrabold">{summary.total}</p>
            </div>
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">Active</p>
              <p className="mt-2 font-display text-4xl font-extrabold">{summary.active}</p>
            </div>
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">Out of Service</p>
              <p className="mt-2 font-display text-4xl font-extrabold">{summary.outOfService}</p>
            </div>
            <div className="rounded-[1.2rem] bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-[#bfe8db]">Filtered Results</p>
              <p className="mt-2 font-display text-4xl font-extrabold">{summary.filtered}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-[#cfe7df] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2d7f6b]">Search & Filter</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#062321]">
                Find the right campus resource
              </h2>
            </div>
            <button
              type="button"
              onClick={loadResources}
              className="rounded-xl border border-[#b7d7cd] px-4 py-2.5 text-sm font-bold text-[#14433b] transition hover:bg-[#eef8f3]"
            >
              Refresh Catalogue
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="text-sm font-bold text-[#1a4b43]">Search</span>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Name, location, description"
                className="mt-2 w-full rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none transition focus:border-[#2d7f6b]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#1a4b43]">Type</span>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none transition focus:border-[#2d7f6b]"
              >
                {resourceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Types" : formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#1a4b43]">Location</span>
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none transition focus:border-[#2d7f6b]"
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Locations" : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#1a4b43]">Status</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none transition focus:border-[#2d7f6b]"
              >
                {resourceStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Statuses" : formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#1a4b43]">Min Capacity</span>
              <input
                type="number"
                min="0"
                value={minimumCapacity}
                onChange={(event) => setMinimumCapacity(event.target.value)}
                placeholder="e.g. 50"
                className="mt-2 w-full rounded-xl border border-[#c9e0d8] bg-white px-4 py-3 text-[#062321] outline-none transition focus:border-[#2d7f6b]"
              />
            </label>
          </div>
        </div>

        {isAdmin && (
          <section className="mt-8 rounded-[1.75rem] border border-[#cfe7df] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2d7f6b]">Admin Tool</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#062321]">
                  Add a new resource to the catalogue
                </h2>
              </div>
              <p className="text-sm text-[#58726c]">Visible only to admin users because `POST /resources` is secured.</p>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleCreateResource}>
              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Resource Name</span>
                <input
                  required
                  name="name"
                  value={formState.name}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Type</span>
                <select
                  name="type"
                  value={formState.type}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                >
                  {resourceTypeOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => (
                      <option key={option} value={option}>
                        {formatEnumLabel(option)}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Capacity</span>
                <input
                  required
                  min="0"
                  type="number"
                  name="capacity"
                  value={formState.capacity}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Location</span>
                <input
                  required
                  name="location"
                  value={formState.location}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Available From</span>
                <input
                  required
                  type="time"
                  name="availableFrom"
                  value={formState.availableFrom}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Available To</span>
                <input
                  required
                  type="time"
                  name="availableTo"
                  value={formState.availableTo}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#1a4b43]">Status</span>
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                >
                  {resourceStatusOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => (
                      <option key={option} value={option}>
                        {formatEnumLabel(option)}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block md:col-span-2 xl:col-span-2">
                <span className="text-sm font-bold text-[#1a4b43]">Description</span>
                <textarea
                  required
                  name="description"
                  value={formState.description}
                  onChange={handleFormChange}
                  rows="4"
                  className="mt-2 w-full rounded-xl border border-[#c9e0d8] px-4 py-3 outline-none focus:border-[#2d7f6b]"
                />
              </label>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#2d7f6b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#205d4f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create Resource"}
                </button>
              </div>
            </form>

            {formMessage && <p className="mt-4 text-sm font-semibold text-[#205d4f]">{formMessage}</p>}
          </section>
        )}

        <section className="mt-8">
          {loading ? (
            <div className="rounded-[1.75rem] border border-[#cfe7df] bg-white p-8 text-center text-[#40665d] shadow-sm">
              Loading resources...
            </div>
          ) : error ? (
            <div className="rounded-[1.75rem] border border-[#f0c5c5] bg-[#fff5f5] p-8 text-center text-[#8b2c2c] shadow-sm">
              {error}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-[1.75rem] border border-[#cfe7df] bg-white p-8 text-center text-[#40665d] shadow-sm">
              No resources match the selected filters.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => (
                <article
                  key={resource.id}
                  className="rounded-[1.6rem] border border-[#cfe7df] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(6,35,33,0.1)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f8f84]">
                        {formatEnumLabel(resource.type)}
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#062321]">
                        {resource.name}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                        resource.status === "ACTIVE"
                          ? "bg-[#e8f7f1] text-[#1c6d58]"
                          : "bg-[#fff0f0] text-[#a94242]"
                      }`}
                    >
                      {formatEnumLabel(resource.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#4f6963]">{resource.description}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f3fbf8] p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8f84]">Location</p>
                      <p className="mt-1 font-semibold text-[#133c35]">{resource.location}</p>
                    </div>
                    <div className="rounded-xl bg-[#f3fbf8] p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8f84]">Capacity</p>
                      <p className="mt-1 font-semibold text-[#133c35]">{resource.capacity}</p>
                    </div>
                    <div className="rounded-xl bg-[#f3fbf8] p-3 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8f84]">Availability</p>
                      <p className="mt-1 font-semibold text-[#133c35]">
                        {formatTimeLabel(resource.availableFrom)} - {formatTimeLabel(resource.availableTo)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};
>>>>>>> theirs

export default ResourcesPage;
