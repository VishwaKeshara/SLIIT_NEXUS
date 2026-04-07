import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const demoAccounts = [
  { label: "Student Demo", email: "student@sliitnexus.com" },
  { label: "Admin Demo", email: "admin@sliitnexus.com" },
];

const Login = () => {
  const [selectedEmail, setSelectedEmail] = useState(demoAccounts[0].email);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginAsDevUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? "/";

  const handleDevLogin = async () => {
    setSubmitting(true);
    setError("");
    try {
      await loginAsDevUser(selectedEmail);
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Unable to sign in with the demo account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 pt-28">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Authentication & Authorization
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight">
            Sign in with Google or use seeded demo roles while you build.
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            The backend supports OAuth 2.0 via Spring Security and Google sign-in. For local demos,
            seeded USER and ADMIN accounts are also available so you can exercise route protection,
            role management, bookings, tickets, and notifications right away.
          </p>
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-sm font-semibold text-slate-100">Production path</p>
            <p className="mt-2 text-sm text-slate-400">
              Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then continue with Google.
            </p>
            <a
              href={authApi.googleLoginUrl}
              className="mt-4 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-200"
            >
              Continue with Google
            </a>
          </div>
        </section>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-900">Development sign-in</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pick a seeded user to test role-based navigation and endpoint access.
          </p>

          <div className="mt-6 space-y-3">
            {demoAccounts.map((account) => (
              <label
                key={account.email}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${
                  selectedEmail === account.email
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-900">{account.label}</p>
                  <p className="text-sm text-slate-500">{account.email}</p>
                </div>
                <input
                  type="radio"
                  name="demo-account"
                  checked={selectedEmail === account.email}
                  onChange={() => setSelectedEmail(account.email)}
                />
              </label>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={handleDevLogin}
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Use selected demo account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
