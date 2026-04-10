import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const allRoles = ["USER", "ADMIN", "TECHNICIAN", "MANAGER"];
const fallbackRoles = ["USER"];
const emptyForm = {
  displayName: "",
  email: "",
  password: "",
  roles: fallbackRoles,
};

const normalizeRoles = (roles) => {
  const roleValues = Array.isArray(roles) ? roles : [roles];
  const normalizedRoles = roleValues
    .map((role) => String(role ?? "").replace(/^ROLE_/, "").trim().toUpperCase())
    .filter((role) => allRoles.includes(role));

  return normalizedRoles.length > 0 ? [...new Set(normalizedRoles)] : fallbackRoles;
};

const getAdminFormError = (err) => {
  const response = err?.response?.data;
  const fieldErrors = response?.errors
    ? Object.entries(response.errors).map(([field, message]) => `${field}: ${message}`)
    : [];

  if (fieldErrors.length > 0) {
    return fieldErrors.join(" ");
  }

  return response?.message ?? "Unable to save the user account.";
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await adminApi.listUsers();
      setUsers(data);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        setError("You are not signed in. Log in again with the admin demo account.");
      } else if (status === 403) {
        setError("Your account is signed in, but it does not have the ADMIN role.");
      } else {
        setError("The admin data could not be loaded. Make sure the backend is running on port 8080.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const resetForm = () => {
    setEditingUserId(null);
    setUserForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const toggleFormRole = (role) => {
    setUserForm((current) => {
      const currentRoles = normalizeRoles(current.roles);
      const hasRole = currentRoles.includes(role);
      const nextRoles = hasRole ? currentRoles.filter((item) => item !== role) : [...currentRoles, role];
      return { ...current, roles: normalizeRoles(nextRoles) };
    });
  };

  const startEdit = (account) => {
    setEditingUserId(account.id);
    setUserForm({
      displayName: account.displayName,
      email: account.email,
      password: "",
      roles: normalizeRoles(account.roles),
    });
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!editingUserId && userForm.password.trim().length < 8) {
      setFormError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (editingUserId && userForm.password.trim() && userForm.password.trim().length < 8) {
      setFormError("Password must be at least 8 characters, or leave it blank to keep the current password.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...userForm,
        roles: normalizeRoles(userForm.roles),
      };

      if (editingUserId) {
        await adminApi.updateUser(editingUserId, {
          ...payload,
          password: userForm.password.trim() ? userForm.password : undefined,
        });
      } else {
        await adminApi.createUser({
          ...payload,
        });
      }
      resetForm();
      await loadUsers();
    } catch (err) {
      setFormError(getAdminFormError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = async (targetUser, role) => {
    const currentRoles = normalizeRoles(targetUser.roles);
    const nextRoles = currentRoles.includes(role)
      ? currentRoles.filter((item) => item !== role)
      : [...currentRoles, role];

    if (nextRoles.length === 0) {
      return;
    }

    await adminApi.updateRoles(targetUser.id, normalizeRoles(nextRoles));
    await loadUsers();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user account?")) {
      return;
    }

    await adminApi.deleteUser(userId);
    if (editingUserId === userId) {
      resetForm();
    }
    await loadUsers();
  };

  return (
    <main className="min-h-screen bg-[#edf4fb] pt-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-8 px-4 pb-16 lg:flex-row lg:items-start lg:px-6">
        <aside className="sticky top-6 rounded-[1.8rem] bg-[#103c35] p-6 text-white shadow-[0_28px_80px_rgba(16,60,53,0.28)] lg:min-h-[calc(100vh-3rem)] lg:w-80 lg:shrink-0">
          <div className="flex items-center gap-4 border-b border-white/15 pb-7">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-[#f2d45c] text-2xl font-black tracking-[0.12em] text-[#103c35]">
              NX
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold">SLIIT Nexus</p>
              <p className="mt-1 text-sm font-semibold text-[#d7eee6]">Admin Workspace</p>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d7eee6]">Role Management</p>
            <h1 className="mt-3 text-3xl font-black">User Role Management</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#d7eee6]">
              Update account roles and manage platform access from one protected workspace.
            </p>
          </div>

          <nav className="mt-8 grid gap-4 text-base font-extrabold">
            <Link to="/profile" className="rounded-[1.15rem] bg-[#f2d45c] px-5 py-4 text-[#103c35] transition hover:bg-[#f7df76]">
              Profile Dashboard
            </Link>
            <Link to="/" className="rounded-[1.15rem] bg-white/12 px-5 py-4 text-white transition hover:bg-white/18">
              Back to home
            </Link>
          </nav>

          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d7eee6]">Signed in as</p>
            <p className="mt-3 text-lg font-extrabold">{user?.displayName}</p>
            <p className="mt-1 text-sm font-semibold text-[#d7eee6]">{user?.email}</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="p-1 text-[#0f342e]">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#39766a]">Smart Campus Access Hub</p>
            <h2 className="font-display mt-3 text-5xl font-extrabold text-[#0f342e] sm:text-6xl">
              Manage platform roles
            </h2>
            <p className="mt-3 max-w-3xl text-base font-semibold text-[#5c746d] sm:text-lg">
              Create, update, and delete user accounts, then fine-tune their role access across the platform.
            </p>
          </header>

          <div className="mt-9 overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(226,241,235,0.5))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">
                  {editingUserId ? "Edit account" : "Create account"}
                </p>
                <h3 className="font-display mt-2 text-4xl font-extrabold text-[#0f342e]">
                  {editingUserId ? "Update an existing user" : "Add a new local user"}
                </h3>
              </div>
              {editingUserId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-[1rem] bg-white px-5 py-3 text-sm font-bold text-[#0f342e] shadow-sm ring-1 ring-[#dbe7df] transition hover:bg-[#f8fbf9]"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form className="mt-6 rounded-[1.6rem] border border-white/80 bg-white/55 p-5 shadow-inner backdrop-blur-xl sm:p-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">Display Name</span>
                <input
                  name="displayName"
                  value={userForm.displayName}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#0f342e]">Email</span>
                <input
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-[#0f342e]">
                  Password {editingUserId ? "(optional)" : ""}
                </span>
                <input
                  name="password"
                  type="password"
                  value={userForm.password}
                  onChange={handleFormChange}
                  placeholder={editingUserId ? "Leave blank to keep current password" : "Set an initial password"}
                  minLength={editingUserId ? undefined : 8}
                  className="mt-2 w-full rounded-[1rem] border border-[#dbe7df] bg-white px-4 py-3 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a]"
                  required={!editingUserId}
                />
                <p className="mt-2 text-xs font-semibold text-[#5c746d]">
                  {editingUserId
                    ? "Use 8 or more characters, or leave blank to keep the current password."
                    : "Use 8 or more characters."}
                </p>
              </label>

              <div className="md:col-span-2">
                <p className="text-sm font-bold text-[#0f342e]">Roles</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleFormRole(role)}
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        userForm.roles.includes(role)
                          ? "bg-[#103c35] text-white"
                          : "bg-white text-[#0f342e] ring-1 ring-[#dbe7df]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              </div>

              {formError && <p className="mt-5 rounded-[1.2rem] bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">{formError}</p>}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(16,60,53,0.18)] transition hover:bg-[#0b2e29] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingUserId ? "Update User" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-[1rem] bg-white px-5 py-3 text-sm font-bold text-[#0f342e] shadow-sm ring-1 ring-[#dbe7df] transition hover:bg-[#f8fbf9]"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8">
            {loading && (
              <div className="rounded-[1.5rem] border border-[#dbe7df] bg-white p-6 font-semibold text-[#5c746d] shadow-sm">
                Loading admin data...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="font-bold text-red-700">{error}</p>
                <p className="mt-2 text-sm font-semibold text-red-600">
                  If you have not signed in yet, open the login page and choose `Admin Demo`.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex rounded-[1rem] bg-[#103c35] px-4 py-2 font-bold text-white hover:bg-[#0b2e29]"
                >
                  Go to login
                </Link>
              </div>
            )}

            {!loading && !error && (
              <div className="grid gap-4 xl:grid-cols-2">
                {users.map((account) => (
                  <article
                    key={account.id}
                    className="group relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-white/65 p-5 shadow-[0_18px_44px_rgba(15,52,46,0.12)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#c5ded4] hover:bg-white/80 hover:shadow-[0_26px_58px_rgba(15,52,46,0.18)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.75),rgba(226,241,235,0.42))]" />
                    <div className="relative">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-extrabold text-[#0f342e]">{account.displayName}</h3>
                        <p className="mt-1 font-semibold text-[#5c746d]">{account.email}</p>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">
                          {account.provider ?? "local"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(account.roles ?? []).map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-[#103c35] px-3 py-1 text-xs font-bold text-white"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(account)}
                        className="rounded-[1rem] bg-[#103c35] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b2e29]"
                      >
                        Edit details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(account.id)}
                        className="rounded-[1rem] bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                      >
                        Delete user
                      </button>
                      {allRoles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(account, role)}
                          className={`rounded-[1rem] px-4 py-2 text-sm font-bold ${
                            (account.roles ?? []).includes(role)
                              ? "bg-[#f2d45c] text-[#103c35] hover:bg-[#f7df76]"
                              : "bg-white text-[#0f342e] ring-1 ring-[#dbe7df] hover:bg-[#f8fbf9]"
                          }`}
                        >
                          {(account.roles ?? []).includes(role) ? `Remove ${role}` : `Add ${role}`}
                        </button>
                      ))}
                    </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
