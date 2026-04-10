import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const formatRole = (role) => role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const roleStyles = {
  ADMIN: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  MANAGER: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  TECHNICIAN: "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200",
  USER: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
};

const ProfilePage = () => {
  const { user, unreadCount, updateAccount, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("overview");
  const [form, setForm] = useState({
    displayName: user?.displayName ?? "",
    email: user?.email ?? "",
    password: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials =
    user?.displayName
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
    { label: "Profile ID", value: user?.id ?? "Not available" },
    { label: "Primary Role", value: formatRole(primaryRole) },
    { label: "Unread Alerts", value: String(unreadCount) },
    { label: "Active Roles", value: String(user?.roles?.length ?? 0) },
  ];

  const panelTitle =
    {
      overview: "Account Profile Dashboard",
      edit: "Edit Profile Details",
      access: "Access and Permissions",
    }[activePanel] ?? "Account Profile Dashboard";

  const panelSubtitle =
    {
      overview: "Manage your SLIIT Nexus account, alerts, quick links, and access level from one workspace.",
      edit: "Update your display name, email address, or password for this account.",
      access: "Review the roles connected to your campus workflows and dashboard access.",
    }[activePanel] ?? "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStatusMessage("");
    setError("");
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-[#edf4fb] pt-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-8 px-4 pb-16 lg:flex-row lg:items-start lg:px-6">
        <aside className="sticky top-6 rounded-[1.8rem] bg-[#103c35] p-6 text-white shadow-[0_28px_80px_rgba(16,60,53,0.28)] lg:min-h-[calc(100vh-3rem)] lg:w-80 lg:shrink-0">
          <div className="flex items-center gap-4 border-b border-white/15 pb-7">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[#f2d45c] text-2xl font-black tracking-[0.12em] text-[#103c35]">
              {initials}
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold">SLIIT Nexus</p>
              <p className="mt-1 text-sm font-semibold text-[#d7eee6]">Profile Workspace</p>
            </div>
          </div>

          <nav className="mt-7 grid gap-4 text-base font-extrabold">
            {[
              ["overview", "Dashboard"],
              ["access", "Permissions"],
            ].map(([panel, label]) => (
              <button
                key={panel}
                type="button"
                onClick={() => setActivePanel(panel)}
                className={`rounded-[1.15rem] px-5 py-4 text-left text-white transition ${
                  activePanel === panel ? "bg-white/24" : "bg-white/12 hover:bg-white/18"
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-[1.15rem] bg-white/12 px-5 py-4 text-left text-white transition hover:bg-white/18"
            >
              User Role Management
            </button>
            <button
              type="button"
              onClick={() => navigate("/bookings")}
              className="rounded-[1.15rem] bg-white/12 px-5 py-4 text-left text-white transition hover:bg-white/18"
            >
              Bookings
            </button>
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="rounded-[1.15rem] bg-white/12 px-5 py-4 text-left text-white transition hover:bg-white/18"
            >
              Ticketing
            </button>
            <button
              type="button"
              onClick={() => navigate("/resources")}
              className="rounded-[1.15rem] bg-white/12 px-5 py-4 text-left text-white transition hover:bg-white/18"
            >
              Resources
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-[1.15rem] bg-[#f2d45c] px-5 py-4 text-left text-base font-black text-[#103c35] transition hover:bg-[#f7df76]"
            >
              Logout
            </button>
          </nav>

          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
            <p className="font-display text-2xl font-extrabold">Account Flow</p>
            <p className="mt-3 text-sm leading-6 text-[#d7eee6]">
              Keep your profile details, permissions, and campus shortcuts in one place.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="p-1 text-[#0f342e]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#39766a]">Smart Campus Account Hub</p>
                <h1 className="font-display mt-3 text-5xl font-extrabold text-[#0f342e] sm:text-6xl">
                  {panelTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-base font-semibold text-[#5c746d] sm:text-lg">{panelSubtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActivePanel("overview")}
                  className={`rounded-[1.35rem] px-7 py-4 text-base font-black shadow-[0_12px_28px_rgba(15,52,46,0.08)] ${
                    activePanel === "overview" ? "bg-[#f2d45c] text-[#103c35]" : "bg-white text-[#0f342e]"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("edit")}
                  className={`rounded-[1.35rem] px-7 py-4 text-base font-black shadow-[0_12px_28px_rgba(16,60,53,0.1)] ${
                    activePanel === "edit" ? "bg-[#f2d45c] text-[#103c35]" : "bg-white text-[#0f342e]"
                  }`}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </header>

          {activePanel === "overview" && (
            <>
              <div className="mt-9 grid gap-6 md:grid-cols-4">
                {overviewCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[1.8rem] bg-white p-7 shadow-[0_18px_42px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef]"
                  >
                    <p className="text-base font-extrabold text-[#5b7493]">{card.label}</p>
                    <p className="mt-6 font-display text-4xl font-extrabold text-[#0f342e]">{card.value}</p>
                  </div>
                ))}
              </div>

              <section className="mt-9 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(226,241,235,0.5))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-xl sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#103c35] text-2xl font-black tracking-[0.12em] text-[#f2d45c]">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Account Profile</p>
                        <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">
                          {user?.displayName}
                        </h2>
                        <p className="mt-2 text-base font-semibold text-[#5c746d]">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel("edit")}
                      className="rounded-[1.2rem] bg-[#f2d45c] px-5 py-3 text-sm font-black text-[#103c35] shadow-sm transition hover:bg-[#f7df76]"
                    >
                      Update Profile
                    </button>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => navigate("/bookings")}
                      className="rounded-[1.4rem] bg-white p-5 text-center text-[#0f342e] shadow-sm ring-1 ring-[#dbe7df] transition hover:-translate-y-1"
                    >
                      <p className="text-xl font-extrabold">Bookings</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/tickets")}
                      className="rounded-[1.4rem] bg-[#103c35] p-5 text-center text-white shadow-[0_14px_34px_rgba(16,60,53,0.18)] transition hover:-translate-y-1"
                    >
                      <p className="text-xl font-extrabold">Support Desk</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/notifications")}
                      className="rounded-[1.4rem] bg-[#f2d45c] p-5 text-center text-[#103c35] shadow-[0_14px_34px_rgba(16,60,53,0.1)] transition hover:-translate-y-1"
                    >
                      <p className="text-xl font-extrabold">Notifications</p>
                    </button>
                  </div>
                </div>

                <aside className="rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Current Status</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">Alerts</h2>
                  <p className="mt-5 text-5xl font-black text-[#103c35]">{unreadCount}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5c746d]">
                    {unreadCount > 0
                      ? `${unreadCount} alert${unreadCount > 1 ? "s" : ""} waiting in your notification center.`
                      : "All caught up."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/notifications")}
                    className="mt-6 w-full rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29]"
                  >
                    Open Notifications
                  </button>
                </aside>
              </section>
            </>
          )}

          {activePanel === "edit" && (
            <section className="mt-9 overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(226,241,235,0.5))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Account Tool</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">Profile Details</h2>
                  <p className="mt-2 text-sm font-semibold text-[#5c746d]">
                    Leave the password field blank to keep your current password.
                  </p>
                </div>
              </div>

              <form
                className="mt-6 rounded-[1.6rem] border border-white/80 bg-white/55 p-5 shadow-inner backdrop-blur-xl sm:p-6"
                onSubmit={handleSave}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Display Name</span>
                    <input
                      name="displayName"
                      value={form.displayName}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Email Address</span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-bold text-[#0f342e]">New Password</span>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                    />
                  </label>
                </div>

                {(statusMessage || error) && (
                  <div className="mt-5 rounded-[1.2rem] bg-white p-4 ring-1 ring-[#dbe7df]">
                    {statusMessage && <p className="text-sm font-bold text-emerald-700">{statusMessage}</p>}
                    {error && <p className="text-sm font-bold text-red-700">{error}</p>}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(16,60,53,0.18)] transition hover:bg-[#0b2e29] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Update Profile"}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="rounded-[1rem] bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(185,28,28,0.14)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activePanel === "access" && (
            <section className="mt-9 rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Permissions</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">Role Access</h2>
                </div>
                {user?.roles?.includes("ADMIN") && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin/dashboard")}
                    className="rounded-[1.2rem] bg-[#f2d45c] px-5 py-3 text-sm font-black text-[#103c35] shadow-sm transition hover:bg-[#f7df76]"
                  >
                    Open Admin Console
                  </button>
                )}
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(user?.roles ?? []).map((role) => (
                  <article
                    key={role}
                    className="group relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-white/65 p-5 shadow-[0_18px_44px_rgba(15,52,46,0.12)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#c5ded4] hover:bg-white/80 hover:shadow-[0_26px_58px_rgba(15,52,46,0.18)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.75),rgba(226,241,235,0.42))]" />
                    <div className="relative">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Assigned Role</p>
                      <h3 className="mt-3 text-2xl font-extrabold text-[#0f342e]">{formatRole(role)}</h3>
                      <span
                        className={`mt-5 inline-flex rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                          roleStyles[role] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                        }`}
                      >
                        {role}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
