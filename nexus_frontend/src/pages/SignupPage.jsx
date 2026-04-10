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
    <main className="relative min-h-screen overflow-hidden bg-[#052d27] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,27,26,0.48)_0%,rgba(3,27,26,0.44)_24%,rgba(3,27,26,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,242,222,0.16),transparent_36%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-white/10 bg-[rgba(4,27,24,0.24)] p-6 shadow-[0_28px_90px_rgba(3,27,26,0.35)] backdrop-blur-[3px] sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#bfe8db]">Create Account</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
            Join SLIIT Nexus with a campus-ready local account.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium text-[#e0efea] sm:text-lg">
            Start with a streamlined workspace for bookings, maintenance requests, notifications, and profile access.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-[#a5d8c8] bg-[#dff4eb] p-5 text-[#062321] shadow-[0_20px_50px_rgba(3,27,26,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">Access</p>
              <p className="mt-3 text-lg font-bold">New accounts start with the `USER` role by default.</p>
            </article>
            <article className="rounded-[1.5rem] border border-[#a5d8c8] bg-[#dff4eb] p-5 text-[#062321] shadow-[0_20px_50px_rgba(3,27,26,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">Control</p>
              <p className="mt-3 text-lg font-bold">Update your profile details later whenever you need.</p>
            </article>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[#b5e0d3] bg-[#ecf7f1] p-5 text-[#062321] shadow-[0_20px_60px_rgba(3,27,26,0.18)]">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#4d8d7f]">What you get</p>
            <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-[#18463d]">
              One place to manage campus requests and daily updates.
            </p>
            <p className="mt-3 text-sm font-medium text-[#285a48] sm:text-base">
              This keeps the first-time user journey visually consistent with the homepage and sign-in experience.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#b5e0d3] bg-[#ecf7f1] p-6 text-[#062321] shadow-[0_28px_80px_rgba(3,27,26,0.24)] sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#4d8d7f]">New Account</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#18463d]">
            Sign Up
          </h2>
          <p className="mt-3 text-sm font-medium text-[#285a48] sm:text-base">
            Create your local Nexus account to get started.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Display Name</span>
              <input
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[#b5e0d3] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="Your full name"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
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
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[#b5e0d3] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="Minimum 8 characters"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Confirm Password</span>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-[#b5e0d3] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="Re-enter your password"
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#2f8a74] px-4 py-3 font-extrabold text-white shadow-[0_14px_30px_rgba(47,138,116,0.26)] transition hover:bg-[#236a59] disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm font-medium text-[#285a48]">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#2f8a74] hover:text-[#236a59]">
              Sign in here
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default SignupPage;
