import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

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
    <main className="min-h-screen bg-[#eef5f2] px-4 pb-16 pt-28 text-[#062321] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-[#cddfd8] bg-white shadow-[0_24px_80px_rgba(3,27,26,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <section
          className="relative min-h-[320px] bg-cover bg-center p-8 text-white lg:min-h-full"
          style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,27,26,0.4)_0%,rgba(3,27,26,0.82)_100%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-black tracking-[0.18em] text-[#062321]">
                NX
              </span>
              <span>
                <span className="block text-xl font-black">SLIIT NEXUS</span>
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#cde9de]">Campus Portal</span>
              </span>
            </Link>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#cde9de]">Create account</p>
              <h1 className="mt-3 max-w-md text-4xl font-black leading-tight">Start your campus workspace.</h1>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f8a74]">New Account</p>
          <h2 className="mt-3 text-4xl font-black text-[#18463d]">Sign Up</h2>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Display Name</span>
              <input
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-[#cddfd8] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
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
                className="mt-2 w-full rounded-lg border border-[#cddfd8] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
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
                className="mt-2 w-full rounded-lg border border-[#cddfd8] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
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
                className="mt-2 w-full rounded-lg border border-[#cddfd8] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="Re-enter your password"
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#2f8a74] px-4 py-3 font-extrabold text-white shadow-[0_14px_30px_rgba(47,138,116,0.26)] transition hover:bg-[#236a59] disabled:opacity-60"
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
