import { useEffect, useState } from "react";
import { resourceApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const resourceTypes = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const resourceStatuses = ["ACTIVE", "OUT_OF_SERVICE"];

const initialForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: 1,
  location: "",
  availableFrom: "08:00",
  availableTo: "17:00",
  status: "ACTIVE",
  description: "",
};

const mapErrorMessage = (error, fallback) => {
  const message = String(error?.response?.data?.message || "");
  const lower = message.toLowerCase();

  if (lower.includes("mongo") || lower.includes("connection refused") || lower.includes("timed out")) {
    return "Service is temporarily unavailable. Please check backend database connection and try again.";
  }
  if (lower.includes("validation")) return "Please check the form values and try again.";
  if (lower.includes("unauthorized") || error?.response?.status === 401) return "Please sign in again to continue.";
  if (lower.includes("forbidden") || error?.response?.status === 403) return "You do not have permission for this action.";
  return fallback;
};

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const isAdmin = (user?.roles ?? []).includes("ADMIN");

  const loadResources = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await resourceApi.list();
      setResources(data ?? []);
    } catch (err) {
      setError(mapErrorMessage(err, "Failed to load resources. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await resourceApi.create(form);
      setForm(initialForm);
      await loadResources();
    } catch (err) {
      setError(mapErrorMessage(err, "Failed to create resource. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3FBF7] px-4 pb-12 pt-24 text-[#031B1A]">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-[#cfe4dc] bg-[#eef7f3] p-6 shadow-[0_10px_30px_rgba(3,27,26,0.08)]">
          <h1 className="font-display text-4xl font-extrabold">Facilities and Assets Catalogue</h1>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-[#efc8d0] bg-[#fff2f5] px-5 py-4">
            <p className="text-base font-semibold text-[#9a2942]">{error}</p>
            <button
              type="button"
              onClick={loadResources}
              className="mt-3 rounded-lg bg-[#2E7D69] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E3B34]"
            >
              Retry
            </button>
          </div>
        )}

        {isAdmin && (
          <section className="mt-8 rounded-3xl border border-[#cfe4dc] bg-white p-6 shadow-[0_10px_30px_rgba(3,27,26,0.08)]">
            <h2 className="text-3xl font-extrabold text-[#0E3B34]">Add New Resource</h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                />
              </label>

              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Type
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                >
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Capacity
                <input
                  type="number"
                  min={1}
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                />
              </label>

              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                />
              </label>

              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Available From
                <input
                  type="time"
                  name="availableFrom"
                  value={form.availableFrom}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                />
              </label>

              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Available To
                <input
                  type="time"
                  name="availableTo"
                  value={form.availableTo}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                />
              </label>

              <label className="grid gap-2 text-base font-semibold text-[#1f4a43]">
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                >
                  {resourceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 grid gap-2 text-base font-semibold text-[#1f4a43]">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="rounded-xl border border-[#bddfd3] bg-[#f7fcfa] px-3 py-2.5 outline-none focus:border-[#2E7D69]"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#2E7D69] px-5 py-2.5 text-base font-bold text-white hover:bg-[#0E3B34] disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Resource"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-3xl font-extrabold text-[#0E3B34]">Resource List</h2>
          {loading ? (
            <p className="mt-4 text-base text-[#34514a]">Loading resources...</p>
          ) : resources.length === 0 ? (
            <p className="mt-4 text-base text-[#34514a]">No resources available yet.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {resources.map((resource) => (
                <article key={resource.id} className="rounded-2xl border border-[#cfe4dc] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-extrabold text-[#031B1A]">{resource.name}</h3>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[#2E7D69]">{resource.type}</p>
                      <p className="mt-2 text-[#34514a]">{resource.location}</p>
                      <p className="text-[#34514a]">
                        Capacity: <span className="font-semibold">{resource.capacity}</span>
                      </p>
                      <p className="text-[#34514a]">
                        Available: {resource.availableFrom} - {resource.availableTo}
                      </p>
                      {resource.description && <p className="mt-3 text-[#34514a]">{resource.description}</p>}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                        resource.status === "ACTIVE" ? "bg-[#d9f2e8] text-[#0E3B34]" : "bg-[#fde2e8] text-[#9a2942]"
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ResourcesPage;
