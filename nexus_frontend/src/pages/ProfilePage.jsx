import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const formatRole = (role) => role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatProfileId = (user) => {
  const existingProfileId = user?.profileId ?? user?.profile_id ?? user?.userCode;
  if (existingProfileId) return String(existingProfileId);
  const rawId = String(user?.id ?? "");
  const numericSuffix = rawId.match(/\d+$/)?.[0];
  if (numericSuffix) return `profile_id-${Number(numericSuffix)}`;
  if (!rawId) return "profile_id-1";
  const hash = [...rawId].reduce((total, char) => total + char.charCodeAt(0), 0);
  return `profile_id-${(hash % 999) + 1}`;
};

const roleStyles = {
  ADMIN: "bg-[#fff3c4] text-[#8a6a13] ring-1 ring-[#f2d77b]",
  MANAGER: "bg-[#dcfce7] text-[#166534] ring-1 ring-[#86efac]",
  TECHNICIAN: "bg-[#dbeafe] text-[#1d4ed8] ring-1 ring-[#93c5fd]",
  USER: "bg-[#e5e7eb] text-[#374151] ring-1 ring-[#d1d5db]",
};

const SidebarButton = ({ active = false, children, fillClass, tone = "light", ...props }) => (
  <button
    type="button"
    className={`group relative overflow-hidden rounded-[1rem] border border-white/12 bg-white/10 px-5 py-4 text-left font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)] ${
      active ? "text-[#07251f]" : "text-white"
    } ${tone === "dark" ? "hover:text-white" : "hover:text-[#07251f]"}`}
    {...props}
  >
    <span className={`absolute inset-y-0 left-0 ${active ? "w-full" : "w-0"} ${fillClass} transition-all duration-500 ease-out group-hover:w-full`} />
    <span className="relative z-10">{children}</span>
  </button>
);

const StatCard = ({ detail, label, value }) => (
  <article className="rounded-[1.5rem] border border-white/10 bg-white p-6 shadow-[0_18px_50px_rgba(6,34,30,0.1)]">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b8f88]">{label}</p>
    <p className="mt-4 break-words font-display text-4xl font-extrabold tracking-[-0.05em] text-[#07251f]">{value}</p>
    <p className="mt-2 text-sm font-semibold text-[#60726c]">{detail}</p>
  </article>
);

const Panel = ({ children, eyebrow, title, action }) => (
  <section className="rounded-[1.8rem] border border-white/10 bg-white p-6 shadow-[0_18px_50px_rgba(6,34,30,0.1)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6a13]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#07251f]">{title}</h2>
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
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

  const overviewCards = useMemo(
    () => [
      { label: "Profile ID", value: profileId, detail: "Internal identity reference used across campus systems." },
      { label: "Primary Role", value: formatRole(primaryRole), detail: "Main access level driving your dashboards and tools." },
      { label: "Unread Alerts", value: String(unreadCount), detail: "Notifications waiting for review in your alert center." },
      { label: "Active Roles", value: String(roles.length), detail: "Role assignments currently active on this account." },
    ],
    [primaryRole, profileId, roles.length, unreadCount]
  );

  const quickLinks = [
    { label: "Bookings", path: "/bookings", tone: "bg-[linear-gradient(135deg,#07251f,#12453a)] text-white" },
    { label: "Ticketing", path: "/tickets", tone: "bg-white text-[#07251f] border border-[#d8e3de]" },
    { label: "Notifications", path: "/notifications", tone: "bg-[#d4af37] text-[#07251f]" },
    { label: "Resources", path: canManageResources ? "/resources/dashboard" : "/availability", tone: "bg-white text-[#07251f] border border-[#d8e3de]" },
  ];

  const accessHighlights = [
    { label: "Campus Access", value: roles.length > 1 ? "Multi-role" : "Single-role", detail: "Your account spans multiple service areas when needed." },
    { label: "Operations Access", value: canManageResources ? "Enabled" : "Standard", detail: "Controls resource management and availability access." },
    { label: "Admin Access", value: isAdmin ? "Full" : "Restricted", detail: "Defines whether user administration and oversight are available." },
  ];

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
    if (!window.confirm("Delete this account permanently?")) return;
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#154337_0%,#0d2b25_24%,#061713_58%,#04110e_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1820px]">
        <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,32,27,0.94),rgba(12,54,46,0.88)_42%,rgba(249,250,247,0.98)_130%)] shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
          <div className="grid xl:grid-cols-[320px_1fr]">
            <aside className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(5,20,17,0.98),rgba(12,47,40,0.98))] p-6 text-white xl:p-8">
              <div className="flex items-center gap-4 border-b border-white/10 pb-7">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[#d4af37] text-2xl font-black tracking-[0.12em] text-[#07251f]">
                  {initials}
                </div>
                <div>
                  <p className="font-display text-3xl font-extrabold">SLIIT Nexus</p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-[#d7c27c]">Profile Command Center</p>
                </div>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7c27c]">Signed in</p>
                <p className="mt-3 text-xl font-extrabold">{displayName}</p>
                <p className="mt-1 text-sm font-semibold text-white/70">{email}</p>
              </div>

              <nav className="mt-7 grid gap-4 text-base font-extrabold">
                <SidebarButton active={activePanel === "overview"} onClick={() => setActivePanel("overview")} fillClass="bg-[linear-gradient(90deg,#d4af37,#f7de7a)]">Overview</SidebarButton>
                <SidebarButton active={activePanel === "edit"} onClick={() => setActivePanel("edit")} fillClass="bg-[linear-gradient(90deg,#c7f9cc,#84cc16)]">Edit Profile</SidebarButton>
                <SidebarButton active={activePanel === "access"} onClick={() => setActivePanel("access")} fillClass="bg-[linear-gradient(90deg,#bae6fd,#99f6e4)]">Permissions</SidebarButton>
                {isAdmin && (
                  <SidebarButton onClick={() => navigate("/admin/dashboard")} fillClass="bg-[linear-gradient(90deg,#d4af37,#fef3c7)]">Admin Control Center</SidebarButton>
                )}
                <SidebarButton onClick={handleLogout} fillClass="bg-[linear-gradient(90deg,#fef08a,#fb923c)]">Logout</SidebarButton>
              </nav>

              <div className="mt-8 rounded-[1.5rem] border border-[#d4af37]/30 bg-[#d4af37]/10 p-5 text-[#f9f3db]">
                <p className="text-xs font-black uppercase tracking-[0.18em]">Profile Summary</p>
                <div className="mt-4 space-y-4">
                  {accessHighlights.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-bold">{item.label}</p>
                        <p className="text-xl font-extrabold">{item.value}</p>
                      </div>
                      <p className="mt-1 text-sm text-[#f4e8bb]/85">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="bg-[linear-gradient(180deg,rgba(247,249,246,0.98),rgba(239,245,241,0.98))] p-6 text-[#07251f] sm:p-8">
              <header className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-4xl">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8a6a13]">Smart Campus Identity Hub</p>
                  <h1 className="mt-3 text-5xl font-extrabold tracking-[-0.06em] text-[#07251f] sm:text-6xl">
                    {activePanel === "overview" ? "Account Profile Dashboard" : activePanel === "edit" ? "Edit Profile Details" : "Access And Permissions"}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#536861] sm:text-lg">
                    {activePanel === "overview"
                      ? "Review your account posture, notifications, roles, and smart campus shortcuts from one premium workspace."
                      : activePanel === "edit"
                        ? "Update your display name, email address, and password while keeping account access under control."
                        : "Understand the permissions, operational access, and campus systems available to your account."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setActivePanel("overview")} className={`rounded-[1rem] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${activePanel === "overview" ? "bg-[#07251f] text-white" : "border border-[#d8e3de] bg-white text-[#07251f]"}`}>Overview</button>
                  <button type="button" onClick={() => setActivePanel("edit")} className={`rounded-[1rem] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${activePanel === "edit" ? "bg-[#d4af37] text-[#07251f]" : "border border-[#d8e3de] bg-white text-[#07251f]"}`}>Edit Profile</button>
                </div>
              </header>

              {activePanel === "overview" && (
                <>
                  <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card) => (
                      <StatCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
                    ))}
                  </section>

                  <section className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
                    <Panel
                      eyebrow="Identity"
                      title="Profile Overview"
                      action={<button type="button" onClick={() => setActivePanel("edit")} className="rounded-[1rem] bg-[#d4af37] px-4 py-2 text-sm font-black text-[#07251f] transition hover:bg-[#e0bf58]">Update Profile</button>}
                    >
                      <div className="flex flex-wrap items-center gap-5">
                        <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#07251f,#12453a)] text-3xl font-black text-[#d4af37]">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#8a6a13]">Account Identity</p>
                          <h2 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[#07251f]">{displayName}</h2>
                          <p className="mt-2 text-base font-semibold text-[#60726c]">{email}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {roles.map((role) => (
                              <span key={role} className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${roleStyles[role] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {quickLinks.map((item) => (
                          <button key={item.label} type="button" onClick={() => navigate(item.path)} className={`rounded-[1.2rem] px-5 py-5 text-left text-sm font-black uppercase tracking-[0.14em] transition hover:-translate-y-0.5 ${item.tone}`}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </Panel>

                    <Panel eyebrow="Notifications" title="Alert Status">
                      <div className="rounded-[1.5rem] border border-[#d8e3de] bg-[#f8fbf9] p-6">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6a13]">Unread Notifications</p>
                        <p className="mt-4 text-6xl font-extrabold tracking-[-0.05em] text-[#07251f]">{unreadCount}</p>
                        <p className="mt-4 text-sm font-semibold leading-6 text-[#60726c]">
                          {unreadCount > 0
                            ? `${unreadCount} alert${unreadCount > 1 ? "s" : ""} waiting in your notification center.`
                            : "All campus alerts have been reviewed. You are fully up to date."}
                        </p>
                        <button type="button" onClick={() => navigate("/notifications")} className="mt-6 w-full rounded-[1rem] bg-[#07251f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f382f]">
                          Open Notifications
                        </button>
                      </div>
                    </Panel>
                  </section>
                </>
              )}

              {activePanel === "edit" && (
                <Panel eyebrow="Account Tool" title="Edit Profile Details">
                  <form onSubmit={handleSave} className="rounded-[1.5rem] border border-[#d8e3de] bg-[#f8fbf9] p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-bold text-[#07251f]">Display Name</span>
                        <input name="displayName" value={form.displayName} onChange={handleChange} className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#0f5a48]" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-bold text-[#07251f]">Email Address</span>
                        <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#0f5a48]" />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="text-sm font-bold text-[#07251f]">New Password</span>
                        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current password" className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#0f5a48]" />
                      </label>
                    </div>

                    {(statusMessage || error) && (
                      <div className="mt-5 rounded-[1rem] bg-white p-4 ring-1 ring-[#e2ece7]">
                        {statusMessage && <p className="text-sm font-bold text-emerald-700">{statusMessage}</p>}
                        {error && <p className="text-sm font-bold text-red-700">{error}</p>}
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="submit" disabled={saving} className="rounded-[1rem] bg-[#07251f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f382f] disabled:cursor-not-allowed disabled:opacity-60">
                        {saving ? "Saving..." : "Update Profile"}
                      </button>
                      <button type="button" disabled={deleting} onClick={handleDelete} className="rounded-[1rem] bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {deleting ? "Deleting..." : "Delete Account"}
                      </button>
                    </div>
                  </form>
                </Panel>
              )}

              {activePanel === "access" && (
                <>
                  <section className="mt-8 grid gap-4 md:grid-cols-3">
                    {accessHighlights.map((item) => (
                      <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
                    ))}
                  </section>

                  <Panel
                    eyebrow="Permissions"
                    title="Role Access Matrix"
                    action={isAdmin ? <button type="button" onClick={() => navigate("/admin/dashboard")} className="rounded-[1rem] bg-[#d4af37] px-4 py-2 text-sm font-black text-[#07251f] transition hover:bg-[#e0bf58]">Open Admin Console</button> : null}
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {roles.map((role) => (
                        <article key={role} className="rounded-[1.4rem] border border-[#d8e3de] bg-[#f8fbf9] p-5">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6a13]">Assigned Role</p>
                          <h3 className="mt-3 text-2xl font-extrabold text-[#07251f]">{formatRole(role)}</h3>
                          <span className={`mt-5 inline-flex rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${roleStyles[role] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}>
                            {role}
                          </span>
                        </article>
                      ))}
                    </div>
                  </Panel>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
