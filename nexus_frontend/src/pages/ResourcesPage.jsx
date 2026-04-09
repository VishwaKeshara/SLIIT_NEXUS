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
      setResources(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load resources.");
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
      setError(err?.response?.data?.message || "Failed to create resource.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-28 pb-12">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Module A</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Facilities and Assets Catalogue</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Browse all bookable campus resources. Admin users can register new resources with type, location,
            availability window, and status.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {isAdmin && (
          <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Add New Resource</h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Type
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Capacity
                <input
                  type="number"
                  min={1}
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Available From
                <input
                  type="time"
                  name="availableFrom"
                  value={form.availableFrom}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Available To
                <input
                  type="time"
                  name="availableTo"
                  value={form.availableTo}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  {resourceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 grid gap-2 text-sm font-semibold text-slate-700">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Resource"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">Resource List</h2>
          {loading ? (
            <p className="mt-4 text-slate-600">Loading resources...</p>
          ) : resources.length === 0 ? (
            <p className="mt-4 text-slate-600">No resources available yet.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {resources.map((resource) => (
                <article key={resource.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{resource.name}</h3>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{resource.type}</p>
                      <p className="mt-2 text-slate-700">{resource.location}</p>
                      <p className="text-slate-600">
                        Capacity: <span className="font-semibold">{resource.capacity}</span>
                      </p>
                      <p className="text-slate-600">
                        Available: {resource.availableFrom} - {resource.availableTo}
                      </p>
                      {resource.description && <p className="mt-3 text-slate-600">{resource.description}</p>}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                        resource.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
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
