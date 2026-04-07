import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-slate-100 px-4 pt-28">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Access denied</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">Your account does not have permission for this route.</h1>
        <p className="mt-4 text-slate-600">
          Admin-only screens are protected in the client and on the backend. Sign in with an ADMIN account
          or ask an administrator to update your roles.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
        >
          Return home
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
