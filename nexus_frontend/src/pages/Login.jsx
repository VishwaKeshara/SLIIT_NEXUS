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
    <main className="relative min-h-screen overflow-hidden bg-[#052d27] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,27,26,0.5)_0%,rgba(3,27,26,0.46)_24%,rgba(3,27,26,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,242,222,0.16),transparent_36%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-white/10 bg-[rgba(4,27,24,0.24)] p-6 shadow-[0_28px_90px_rgba(3,27,26,0.35)] backdrop-blur-[3px] sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#bfe8db]">Welcome Back</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
            Sign in to continue your SLIIT Nexus experience.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium text-[#e0efea] sm:text-lg">
            Manage bookings, monitor incidents, browse resources, and stay updated from one campus-ready workspace.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.5rem] border border-[#a5d8c8] bg-[#dff4eb] p-5 text-[#062321] shadow-[0_20px_50px_rgba(3,27,26,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">Resources</p>
              <p className="mt-3 text-lg font-bold">Reserve campus spaces with fewer clicks.</p>
            </article>
            <article className="rounded-[1.5rem] border border-[#a5d8c8] bg-[#dff4eb] p-5 text-[#062321] shadow-[0_20px_50px_rgba(3,27,26,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">Incidents</p>
              <p className="mt-3 text-lg font-bold">Track maintenance requests from report to resolution.</p>
            </article>
            <article className="rounded-[1.5rem] border border-[#a5d8c8] bg-[#dff4eb] p-5 text-[#062321] shadow-[0_20px_50px_rgba(3,27,26,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">Alerts</p>
              <p className="mt-3 text-lg font-bold">Stay informed with real-time updates and notices.</p>
            </article>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[#b5e0d3] bg-[#ecf7f1] p-5 text-[#062321] shadow-[0_20px_60px_rgba(3,27,26,0.18)]">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#4d8d7f]">Why students use Nexus</p>
            <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-[#18463d]">
              One place for facility access, reporting, and updates.
            </p>
            <p className="mt-3 text-sm font-medium text-[#285a48] sm:text-base">
              The same clean, campus-focused dashboard starts here, so the journey from homepage to sign-in feels consistent.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#b5e0d3] bg-[#ecf7f1] p-6 text-[#062321] shadow-[0_28px_80px_rgba(3,27,26,0.24)] sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">Account Access</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#18463d]">
            Sign In
          </h2>
          <p className="mt-3 text-sm font-medium text-[#285a48] sm:text-base">
            Use your Nexus email and password to access your account.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Email</span>
              <input
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[#b5e0d3] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="you@sliit.lk"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Password</span>
              <input
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[#b5e0d3] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="Enter your password"
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#2f8a74] px-4 py-3 font-extrabold text-white shadow-[0_14px_30px_rgba(47,138,116,0.26)] transition hover:bg-[#236a59] disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-[1.5rem] border border-[#b5e0d3] bg-white p-5">
            <p className="text-sm font-bold text-[#18463d]">Google sign-in</p>
            <p className="mt-2 text-sm text-[#285a48]">
              Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to enable OAuth.
            </p>
            <a
              href={authApi.googleLoginUrl}
              className="mt-4 inline-flex rounded-xl bg-[#dff4eb] px-4 py-3 font-bold text-[#18463d] ring-1 ring-[#b5e0d3] transition hover:bg-[#ccebdd]"
            >
              Continue with Google
            </a>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[#b5e0d3] bg-white p-5">
            <p className="text-sm font-bold text-[#18463d]">Development sign-in</p>
            <p className="mt-2 text-sm text-[#285a48]">
              Demo passwords: `Student123!` and `Admin123!`.
            </p>

            <div className="mt-4 space-y-3">
              {demoAccounts.map((account) => (
                <label
                  key={account.email}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                    selectedEmail === account.email
                      ? "border-[#2f8a74] bg-[#dff4eb]"
                      : "border-[#d4e9df] bg-[#f8fcfa]"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-[#062321]">{account.label}</p>
                    <p className="text-sm text-[#285a48]">{account.email}</p>
                    <p className="text-xs text-[#4d8d7f]">{account.password}</p>
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
              className="mt-4 w-full rounded-2xl bg-[#18463d] px-4 py-3 font-extrabold text-white transition hover:bg-[#12342d] disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Use selected demo account"}
            </button>
          </div>

          <p className="mt-6 text-sm font-medium text-[#285a48]">
            New here?{" "}
            <Link to="/signup" className="font-bold text-[#2f8a74] hover:text-[#236a59]">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default Login;
