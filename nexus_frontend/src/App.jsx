import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import BookingsPage from "./pages/BookingsPage";
import TicketsPage from "./pages/TicketsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import LoginSuccessPage from "./pages/LoginSuccessPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const { pathname } = useLocation();
  const hideChrome = pathname.startsWith("/admin");

  return (
    <>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/success" element={<LoginSuccessPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage />
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
