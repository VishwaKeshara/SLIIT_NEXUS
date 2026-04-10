import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const formatRole = (role) => role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatProfileId = (user) => {
  const existingProfileId = user?.profileId ?? user?.profile_id ?? user?.userCode;

  if (existingProfileId) {
    return String(existingProfileId);
  }

  const rawId = String(user?.id ?? "");
  const numericSuffix = rawId.match(/\d+$/)?.[0];

  if (numericSuffix) {
    return `profile_id-${Number(numericSuffix)}`;
  }

  if (!rawId) {
    return "profile_id-1";
  }

  const hash = [...rawId].reduce((total, char) => total + char.charCodeAt(0), 0);
  return `profile_id-${(hash % 999) + 1}`;
};

const roleStyles = {
  ADMIN: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  MANAGER: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  TECHNICIAN: "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200",
  USER: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
};

const SidebarButton = ({ active = false, children, fillClass, tone = "light", ...props }) => (
  <button
    type="button"
    className={`group relative overflow-hidden rounded-lg border border-white/12 bg-white/10 px-5 py-4 text-left font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)] ${
      active ? "text-[#07251f]" : "text-white"
    } ${tone === "dark" ? "hover:text-white" : "hover:text-[#07251f]"}`}
    {...props}
  >
    <span
      className={`absolute inset-y-0 left-0 ${active ? "w-full" : "w-0"} ${fillClass} transition-all duration-500 ease-out group-hover:w-full`}
    />
    <span className="relative z-10">{children}</span>
  </button>
);

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

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""))
    : [];
  const isAdmin = roles.includes("ADMIN");
  const canManageResources = roles.some((role) => ["ADMIN", "MANAGER"].includes(role));
  const displayName = user?.displayName || "Nexus User";
  const email = user?.email || "No email connected";
  const profileId = formatProfileId(user);

  const primaryRole = roles.includes("ADMIN")
    ? "ADMIN"
    : roles.includes("MANAGER")
      ? "MANAGER"
      : roles.includes("TECHNICIAN")
        ? "TECHNICIAN"
        : "USER";

  const overviewCards = [
    { label: "Profile ID", value: profileId },
    { label: "Primary Role", value: formatRole(primaryRole) },
    { label: "Unread Alerts", value: String(unreadCount) },
    { label: "Active Roles", value: String(roles.length) },
  ];

  const sidebarItems = [
    ["overview", "Dashboard", "bg-[linear-gradient(90deg,#a7f3d0,#f8e06d)]"],
    ["access", "Permissions", "bg-[linear-gradient(90deg,#bae6fd,#a7f3d0)]"],
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
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7fbf7_0%,#e8f5ef_45%,#fff8e6_100%)] pt-6">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(90deg,rgba(12,71,61,0.12),rgba(248,224,109,0.18),rgba(251,146,60,0.08))]" />
      <div className="relative mx-auto flex max-w-[1800px] flex-col gap-8 px-4 pb-16 lg:flex-row lg:items-start lg:px-6">
        <aside className="sticky top-6 overflow-hidden rounded-lg bg-[linear-gradient(160deg,#10211e_0%,#0c473d_54%,#5a3a14_100%)] p-6 text-white shadow-[0_28px_80px_rgba(16,60,53,0.32)] ring-1 ring-white/15 lg:min-h-[calc(100vh-3rem)] lg:w-80 lg:shrink-0">
          <div className="relative">
          <div className="flex items-center gap-4 border-b border-white/15 pb-7">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#f8e06d,#a7f3d0)] text-2xl font-black tracking-[0.12em] text-[#07251f] shadow-[0_14px_32px_rgba(248,224,109,0.24)]">
              {initials}
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold">SLIIT Nexus</p>
              <p className="mt-1 text-sm font-semibold text-[#d7eee6]">Profile Workspace</p>
            </div>
          </div>

          <nav className="mt-7 grid gap-4 text-base font-extrabold">
            {sidebarItems.map(([panel, label, fade]) => (
              <SidebarButton
                key={panel}
                onClick={() => setActivePanel(panel)}
                active={activePanel === panel}
                fillClass={fade}
              >
                {label}
              </SidebarButton>
            ))}

            {isAdmin && (
              <SidebarButton
                onClick={() => navigate("/admin/dashboard")}
                fillClass="bg-[linear-gradient(90deg,#f8e06d,#fef3c7)]"
              >
                User Role Management
              </SidebarButton>
            )}
            <SidebarButton
              onClick={() => navigate("/bookings")}
              fillClass="bg-[linear-gradient(90deg,#bae6fd,#d9f99d)]"
            >
              Bookings
            </SidebarButton>
            <SidebarButton
              onClick={() => navigate("/tickets")}
              fillClass="bg-[linear-gradient(90deg,#fecdd3,#fed7aa)]"
            >
              Ticketing
            </SidebarButton>
            <SidebarButton
              onClick={() => navigate(canManageResources ? "/resources/dashboard" : "/availability")}
              fillClass="bg-[linear-gradient(90deg,#6f7da6,#4f7f8d)]"
              tone="dark"
            >
              Resources
            </SidebarButton>
            <SidebarButton
              onClick={handleLogout}
              fillClass="bg-[linear-gradient(90deg,#fef08a,#fb923c)]"
            >
              Logout
            </SidebarButton>
          </nav>

          <div className="mt-8 rounded-lg border border-white/15 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
            <p className="font-display text-2xl font-extrabold">Account Flow</p>
            <p className="mt-3 text-sm leading-6 text-[#d7eee6]">
              Keep your profile details, permissions, and campus shortcuts in one place.
            </p>
          </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="rounded-lg border border-white/70 bg-white/55 p-6 text-[#0f342e] shadow-[0_20px_60px_rgba(15,52,46,0.08)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#b46b18]">Smart Campus Account Hub</p>
                <h1 className="font-display mt-3 text-4xl font-extrabold text-[#0f342e] sm:text-5xl">
                  {panelTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-base font-semibold text-[#5c746d] sm:text-lg">{panelSubtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActivePanel("overview")}
                  className={`rounded-lg px-7 py-4 text-base font-black shadow-[0_12px_28px_rgba(15,52,46,0.08)] transition hover:-translate-y-0.5 ${
                    activePanel === "overview" ? "bg-[#f8e06d] text-[#07251f]" : "bg-white/75 text-[#0f342e]"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("edit")}
                  className={`rounded-lg px-7 py-4 text-base font-black shadow-[0_12px_28px_rgba(16,60,53,0.1)] transition hover:-translate-y-0.5 ${
                    activePanel === "edit" ? "bg-[#f8e06d] text-[#07251f]" : "bg-white/75 text-[#0f342e]"
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
                    className="rounded-lg border border-white/70 bg-white/48 p-7 shadow-[0_18px_42px_rgba(15,52,46,0.08)] ring-1 ring-white/70 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-[#f8e06d]/70 hover:bg-white/68 hover:shadow-[0_26px_58px_rgba(15,52,46,0.12)]"
                  >
                    <p className="text-base font-extrabold text-[#6b766d]">{card.label}</p>
                    <p className="mt-6 break-words font-display text-3xl font-extrabold text-[#0f342e]">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <section className="mt-9 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="overflow-hidden rounded-lg border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(232,245,239,0.48)_58%,rgba(255,248,230,0.72))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-2xl sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#0c473d] text-2xl font-black tracking-[0.12em] text-[#f8e06d] shadow-[0_18px_34px_rgba(16,60,53,0.18)]">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b46b18]">Account Profile</p>
                        <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">
                          {displayName}
                        </h2>
                        <p className="mt-2 text-base font-semibold text-[#5c746d]">{email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel("edit")}
                      className="rounded-lg bg-[#f8e06d] px-5 py-3 text-sm font-black text-[#07251f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fde68a]"
                    >
                      Update Profile
                    </button>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => navigate("/bookings")}
                      className="rounded-lg border border-white/70 bg-white/60 p-5 text-center text-[#0f342e] shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-[#ecfdf5]"
                    >
                      <p className="text-xl font-extrabold">Bookings</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/tickets")}
                      className="rounded-lg bg-[#0c473d] p-5 text-center text-white shadow-[0_14px_34px_rgba(16,60,53,0.18)] transition hover:-translate-y-1 hover:bg-[#123f38]"
                    >
                      <p className="text-xl font-extrabold">Support Desk</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/notifications")}
                      className="rounded-lg bg-[#f8e06d] p-5 text-center text-[#07251f] shadow-[0_14px_34px_rgba(16,60,53,0.1)] transition hover:-translate-y-1 hover:bg-[#fed7aa]"
                    >
                      <p className="text-xl font-extrabold">Notifications</p>
                    </button>
                  </div>
                </div>

                <aside className="rounded-lg border border-white/70 bg-white/58 p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-8">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b46b18]">Current Status</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">Alerts</h2>
                  <p className="mt-5 text-5xl font-black text-[#0c473d]">{unreadCount}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5c746d]">
                    {unreadCount > 0
                      ? `${unreadCount} alert${unreadCount > 1 ? "s" : ""} waiting in your notification center.`
                      : "All caught up."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/notifications")}
                    className="mt-6 w-full rounded-lg bg-[#0c473d] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#123f38]"
                  >
                    Open Notifications
                  </button>
                </aside>
              </section>
            </>
          )}

          {activePanel === "edit" && (
            <section className="mt-9 overflow-hidden rounded-lg border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(232,245,239,0.48)_58%,rgba(255,248,230,0.72))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-2xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b46b18]">Account Tool</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">Profile Details</h2>
                  <p className="mt-2 text-sm font-semibold text-[#5c746d]">
                    Leave the password field blank to keep your current password.
                  </p>
                </div>
              </div>

              <form
                className="mt-6 rounded-lg border border-white/80 bg-white/48 p-5 shadow-inner backdrop-blur-2xl sm:p-6"
                onSubmit={handleSave}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Display Name</span>
                    <input
                      name="displayName"
                      value={form.displayName}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none transition focus:border-[#b46b18] focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[#0f342e]">Email Address</span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none transition focus:border-[#b46b18] focus:bg-white"
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
                      className="mt-2 w-full rounded-lg border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none transition focus:border-[#b46b18] focus:bg-white"
                    />
                  </label>
                </div>

                {(statusMessage || error) && (
                  <div className="mt-5 rounded-lg bg-white/75 p-4 ring-1 ring-white/80 backdrop-blur-xl">
                    {statusMessage && <p className="text-sm font-bold text-emerald-700">{statusMessage}</p>}
                    {error && <p className="text-sm font-bold text-red-700">{error}</p>}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#0c473d] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(16,60,53,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123f38] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Update Profile"}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(185,28,28,0.14)] transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activePanel === "access" && (
            <section className="mt-9 rounded-lg border border-white/70 bg-white/58 p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b46b18]">Permissions</p>
                  <h2 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">Role Access</h2>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin/dashboard")}
                    className="rounded-lg bg-[#f8e06d] px-5 py-3 text-sm font-black text-[#07251f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fde68a]"
                  >
                    Open Admin Console
                  </button>
                )}
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => (
                  <article
                    key={role}
                    className="group relative overflow-hidden rounded-lg border border-white/70 bg-white/52 p-5 shadow-[0_18px_44px_rgba(15,52,46,0.12)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-[#f8e06d]/70 hover:bg-white/75 hover:shadow-[0_26px_58px_rgba(15,52,46,0.18)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(232,245,239,0.38)_60%,rgba(255,248,230,0.52))]" />
                    <div className="relative">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b46b18]">Assigned Role</p>
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
