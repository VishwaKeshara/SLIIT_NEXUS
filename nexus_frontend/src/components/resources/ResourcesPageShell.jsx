import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import ResourcesLayout from "./ResourcesLayout";

const ResourcesPageShell = ({ children, showDashboardBackLink = false, subtitle, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) => String(role ?? "").trim().toUpperCase().replace(/^ROLE_/, ""))
    : [];
  const isAdmin = roles.some((role) => ["ADMIN", "MANAGER"].includes(role));

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <ResourcesLayout
      isAdmin={isAdmin}
      onLogout={handleLogout}
      showDashboardBackLink={showDashboardBackLink}
      subtitle={subtitle}
      title={title}
    >
      {children}
    </ResourcesLayout>
  );
};

export default ResourcesPageShell;
