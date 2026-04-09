import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const demoAccounts = [
  { label: "Student Demo", email: "student@sliitnexus.com", password: "Student123!" },
  { label: "Admin Demo", email: "admin@sliitnexus.com", password: "Admin123!" },
];

const getFriendlyLoginError = (err, credentials) => {
  const backendMessage = err?.response?.data?.message;
  if (backendMessage) {
    if (backendMessage.toLowerCase().includes("invalid email or password")) {
      const demoAccount = demoAccounts.find(
        (account) => account.email.toLowerCase() === credentials.email.trim().toLowerCase()
      );
      if (demoAccount) {
        return `Invalid password. Try ${demoAccount.password} for ${demoAccount.email}.`;
      }
    }
    return backendMessage;
  }

  if (!err?.response) {
    return "Cannot reach the backend server (http://localhost:8080). Start backend and try again.";
  }

  return "Unable to sign in with those credentials.";
};

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [selectedEmail, setSelectedEmail] = useState(demoAccounts[0].email);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginAsDevUser, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? "/";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signIn(credentials);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFriendlyLoginError(err, credentials));
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_40%,#ffffff_100%)] px-4 pt-28">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_34%),linear-gradient(135deg,#020617,#0f172a_45%,#1d4ed8)] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Welcome Back</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight">
              Sign in to manage bookings, incidents, resources, and alerts.
            </h1>
            <p className="mt-4 max-w-xl text-slate-300">
              Use your local account, continue with Google, or access the seeded demo roles while developing.
            </p>
          </div>

          <div className="grid gap-6 p-8 md:grid-cols-3">
            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resources</p>
              <p className="mt-3 text-lg font-bold text-slate-900">Reserve campus spaces</p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Incidents</p>
              <p className="mt-3 text-lg font-bold text-slate-900">Track support progress</p>
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notifications</p>
              <p className="mt-3 text-lg font-bold text-slate-900">Stay updated in real time</p>
            </article>
          </div>
        </section>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use your Nexus email and password to access your account.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:bg-white"
                placeholder="you@sliit.lk"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:bg-white"
                placeholder="Enter your password"
                required
              />
            </label>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0f172a)] px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.2)] transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Google sign-in</p>
            <p className="mt-2 text-sm text-slate-600">
              Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to enable OAuth.
            </p>
            <a
              href={authApi.googleLoginUrl}
              className="mt-4 inline-flex rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              Continue with Google
            </a>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Development sign-in</p>
            <p className="mt-2 text-sm text-slate-600">
              Demo passwords: `Student123!` and `Admin123!`.
            </p>

            <div className="mt-4 space-y-3">
              {demoAccounts.map((account) => (
                <label
                  key={account.email}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${
                    selectedEmail === account.email ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{account.label}</p>
                    <p className="text-sm text-slate-500">{account.email}</p>
                    <p className="text-xs text-slate-400">{account.password}</p>
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

            <button
              type="button"
              onClick={handleDevLogin}
              disabled={submitting}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Use selected demo account"}
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-600">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-900">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
