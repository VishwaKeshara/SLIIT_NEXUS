import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginSuccessPage = () => {
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const finalize = async () => {
      await refreshAuth();
      navigate("/", { replace: true });
    };

    finalize();
  }, [navigate, refreshAuth]);

  return <div className="min-h-screen bg-slate-50 pt-28 text-center text-slate-600">Completing sign-in...</div>;
};

export default LoginSuccessPage;
