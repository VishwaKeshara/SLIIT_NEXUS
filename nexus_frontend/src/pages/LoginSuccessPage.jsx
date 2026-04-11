import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const LoginSuccessPage = () => {
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const finalize = async () => {
      const signedInUser = await refreshAuth();
      const roles = Array.isArray(signedInUser?.roles)
        ? signedInUser.roles.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""))
        : [];

      navigate(roles.some((role) => ["ADMIN", "MANAGER"].includes(role)) ? "/profile" : "/", { replace: true });
    };

    finalize();
  }, [navigate, refreshAuth]);

  return <div className="min-h-screen bg-slate-50 pt-28 text-center text-slate-600">Completing sign-in...</div>;
};

export default LoginSuccessPage;
