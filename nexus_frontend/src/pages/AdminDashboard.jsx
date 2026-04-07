import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const allRoles = ["USER", "ADMIN", "TECHNICIAN", "MANAGER"];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const toggleRole = async (targetUser, role) => {
    const nextRoles = targetUser.roles.includes(role)
      ? targetUser.roles.filter((item) => item !== role)
      : [...targetUser.roles, role];

    if (nextRoles.length === 0) {
      return;
    }

    await adminApi.updateRoles(targetUser.id, nextRoles);
    await loadUsers();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin workspace</p>
          <h1 className="mt-3 text-3xl font-black">Role Management</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            This dashboard is protected by both frontend route guards and backend role checks. Update account roles
            here to test authorization behavior across the app.
          </p>

          <div className="mt-8 space-y-3">
            <Link to="/bookings" className="block rounded-xl bg-slate-800 px-4 py-3 hover:bg-slate-700">
              Review bookings
            </Link>
            <Link to="/tickets" className="block rounded-xl bg-slate-800 px-4 py-3 hover:bg-slate-700">
              Review tickets
            </Link>
            <Link to="/" className="block rounded-xl bg-slate-800 px-4 py-3 hover:bg-slate-700">
              Back to home
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
            <p className="mt-2 font-semibold">{user?.displayName}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-800 bg-white p-6 text-slate-900 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Access control</p>
          <h2 className="mt-2 text-4xl font-black">Manage platform roles</h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Minimum roles `USER` and `ADMIN` are supported, with optional `TECHNICIAN` and `MANAGER` roles
            included for cleaner separation of permissions.
          </p>

          <div className="mt-8">
            {loading && (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-600">
                Loading admin data...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
                <p className="font-semibold text-rose-700">{error}</p>
                <p className="mt-2 text-sm text-rose-600">
                  If you have not signed in yet, open the login page and choose `Admin Demo`.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
                >
                  Go to login
                </Link>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {users.map((account) => (
                  <article key={account.id} className="rounded-[1.5rem] border border-slate-200 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{account.displayName}</h3>
                        <p className="text-slate-500">{account.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(account.roles ?? []).map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {allRoles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(account, role)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                            (account.roles ?? []).includes(role)
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {(account.roles ?? []).includes(role) ? `Remove ${role}` : `Add ${role}`}
                        </button>
                      ))}
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
