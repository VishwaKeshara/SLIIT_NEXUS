import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/useAuth";

const getFriendlyLoginError = (err) => {
  const backendMessage = err?.response?.data?.message;
  if (backendMessage) {
    return backendMessage;
  }

  if (!err?.response) {
    return "Cannot reach the backend server (http://localhost:8080). Start backend and try again.";
  }

  return "Unable to sign in with those credentials.";
};

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

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

      navigate("/", { replace: true });
    } catch (err) {
      setError(getFriendlyLoginError(err));
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
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#cde9de]">Welcome back</p>
              <h1 className="mt-3 max-w-md text-4xl font-black leading-tight">Sign in to your workspace.</h1>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f8a74]">Account Access</p>
          <h2 className="mt-3 text-4xl font-black text-[#18463d]">Login</h2>

          <a
            href={authApi.googleLoginUrl}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg border border-[#cddfd8] bg-white px-4 py-3 text-sm font-bold text-[#18463d] shadow-sm transition hover:border-[#2f8a74] hover:bg-[#f7fbf9]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-1 2.3-2 3v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 5-.9 6.7-2.5L15.5 17c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.8 19.7 8.2 22 12 22z"
              />
              <path
                fill="#FBBC05"
                d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.4l3.3-2.6z"
              />
              <path
                fill="#EA4335"
                d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3.1 14.7 2 12 2 8.2 2 4.8 4.3 3.1 7.6l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1z"
              />
            </svg>
            Continue with Google
          </a>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#dce9e3]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b867d]">or</span>
            <span className="h-px flex-1 bg-[#dce9e3]" />
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            <label className="block">
              <span className="text-sm font-semibold text-[#18463d]">Email</span>
              <input
                name="email"
                type="email"
                value={credentials.email}
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
                value={credentials.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-[#cddfd8] bg-white px-4 py-3 text-[#12302d] outline-none transition focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
                placeholder="Enter your password"
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#2f8a74] px-4 py-3 font-extrabold text-white shadow-[0_14px_30px_rgba(47,138,116,0.26)] transition hover:bg-[#236a59] disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

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
