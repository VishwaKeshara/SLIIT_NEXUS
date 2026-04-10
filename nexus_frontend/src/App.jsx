import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import BookingsPage from "./pages/BookingsPage";
import TicketsPage from "./pages/TicketsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import LoginSuccessPage from "./pages/LoginSuccessPage";
import ProfilePage from "./pages/ProfilePage";
import ResourcesPage from "./pages/ResourcesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AboutUsPage from "./pages/AboutUsPage";

function App() {
  const { pathname } = useLocation();
  const hideChrome = pathname.startsWith("/admin") || pathname === "/resources" || pathname === "/profile";

  return (
    <>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login/success" element={<LoginSuccessPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <Navigate to="/tickets" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <TicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about-us"
          element={
            <ProtectedRoute>
              <AboutUsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
}

export default App;
