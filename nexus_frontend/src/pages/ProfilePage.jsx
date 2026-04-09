import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const formatRole = (role) => role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const roleStyles = {
  ADMIN: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  MANAGER: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  TECHNICIAN: "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200",
  USER: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
};

const ProfilePage = () => {
  const { user, unreadCount, updateAccount, deleteAccount } = useAuth();
  const [form, setForm] = useState({
    displayName: user?.displayName ?? "",
    email: user?.email ?? "",
    password: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = user?.displayName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") ?? "NX";

  const primaryRole = user?.roles?.includes("ADMIN")
    ? "ADMIN"
    : user?.roles?.includes("MANAGER")
      ? "MANAGER"
      : user?.roles?.includes("TECHNICIAN")
        ? "TECHNICIAN"
        : "USER";

  const overviewCards = [
    {
      label: "Profile ID",
      value: user?.id ?? "Not available",
      tone: "from-slate-950 via-slate-900 to-blue-900 text-white",
    },
    {
      label: "Primary Role",
      value: formatRole(primaryRole),
      tone: "from-blue-600 via-blue-500 to-cyan-500 text-white",
    },
    {
      label: "Unread Alerts",
      value: String(unreadCount),
      tone: "from-white via-slate-50 to-slate-100 text-slate-900",
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      await updateAccount({
        displayName: form.displayName,
        email: form.email,
        password: form.password.trim() ? form.password : undefined,
      });
      setForm((current) => ({ ...current, password: "" }));
      setStatusMessage("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Unable to update your account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this account permanently?")) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteAccount();
      window.location.href = "/signup";
    } catch (err) {
      setError(err?.response?.data?.message ?? "Unable to delete your account.");
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_35%,#ffffff_100%)] px-4 pb-16 pt-28">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_40%),linear-gradient(135deg,#0f172a,#1e3a8a_55%,#38bdf8)] px-6 py-8 text-white md:px-8 md:py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/10 text-2xl font-black tracking-[0.08em] backdrop-blur-sm">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Account Profile</p>
                  <h1 className="mt-2 text-3xl font-black md:text-4xl">{user?.displayName}</h1>
                  <p className="mt-2 text-sm text-blue-50 md:text-base">{user?.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {(user?.roles ?? []).map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm"
                  >
                    {formatRole(role)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {overviewCards.map((card) => (
                  <article
                    key={card.label}
                    className={`rounded-[1.5rem] bg-gradient-to-br ${card.tone} p-5 shadow-sm`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{card.label}</p>
                    <p className="mt-5 text-2xl font-black">{card.value}</p>
                  </article>
                ))}
              </div>

              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Profile Details</p>
                <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
                  <label className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Display Name</p>
                    <input
                      name="displayName"
                      value={form.displayName}
                      onChange={handleChange}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                  <label className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email Address</p>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                  <label className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">New Password</p>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Notification Status</p>
                    <p className="mt-3 text-lg font-bold text-slate-900">
                      {unreadCount > 0 ? `${unreadCount} alert${unreadCount > 1 ? "s" : ""} waiting` : "All caught up"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Access Level: {formatRole(primaryRole)}</p>
                  </div>
                  <div className="md:col-span-2">
                    {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
                    {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Update Profile"}
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={handleDelete}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deleting ? "Deleting..." : "Delete Account"}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Permissions</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(user?.roles ?? []).map((role) => (
                    <span
                      key={role}
                      className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                        roleStyles[role] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Your role set controls which dashboards and moderation tools appear across bookings, tickets, and
                  admin workflows.
                </p>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Quick Access</p>
                <div className="mt-4 grid gap-3">
                  <Link
                    to="/bookings"
                    className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15"
                  >
                    Open bookings
                  </Link>
                  <Link
                    to="/tickets"
                    className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15"
                  >
                    Open support desk
                  </Link>
                  {user?.roles?.includes("ADMIN") && (
                    <Link
                      to="/admin/dashboard"
                      className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Open admin console
                    </Link>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
