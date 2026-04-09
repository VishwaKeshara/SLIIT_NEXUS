import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_40%,#ffffff_100%)] px-4 pt-28">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_35%),linear-gradient(135deg,#0f172a,#1d4ed8_60%,#38bdf8)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Create Account</p>
          <h1 className="mt-4 text-4xl font-black leading-tight">Join Nexus with a local account built for campus workflows.</h1>
          <p className="mt-4 text-sm leading-7 text-blue-50">
            New accounts start with the `USER` role by default, giving access to resources, bookings, incidents,
            notifications, and profile settings.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold">What you get</p>
              <p className="mt-2 text-sm text-blue-50">One place to manage requests, alerts, and campus operations.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold">Profile control</p>
              <p className="mt-2 text-sm text-blue-50">You can update your details or delete the account later from your profile.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold text-slate-900">Sign Up</h2>
          <p className="mt-2 text-sm text-slate-600">Create your local Nexus account to get started.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Display Name</span>
              <input
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:bg-white"
                placeholder="Your full name"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
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
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:bg-white"
                placeholder="Minimum 8 characters"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:bg-white"
                placeholder="Re-enter your password"
                required
              />
            </label>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0f172a)] px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.2)] transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-900">
              Sign in here
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default SignupPage;
