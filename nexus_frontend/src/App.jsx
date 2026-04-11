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
import NotificationsPage from "./pages/NotificationsPage";
import AboutUsPage from "./pages/AboutUsPage";
import ContactUsPage from "./pages/ContactUsPage";
import CheckInPage from "./pages/CheckInPage";
import AddResourcePageView from "./components/resources/add/AddResourcePageView";
import AvailabilityPageView from "./components/resources/availability/AvailabilityPageView";
import BulkImportPageView from "./components/resources/bulk-import/BulkImportPageView";
import ResourcesDashboardPageView from "./components/resources/dashboard/ResourcesDashboardPageView";
import ResourcesListPageView from "./components/resources/list/ResourcesListPageView";

function App() {
  const { pathname } = useLocation();
  const hideChrome =
    pathname.startsWith("/admin") || pathname.startsWith("/resources") || pathname === "/availability" || pathname === "/profile";

  return (
    <>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login/success" element={<LoginSuccessPage />} />
        <Route path="/resources" element={<ResourcesListPageView />} />
        <Route
          path="/resources/dashboard"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <ResourcesDashboardPageView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/add"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <AddResourcePageView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/bulk-import"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <BulkImportPageView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/availability"
          element={
            <ProtectedRoute>
              <Navigate to="/availability" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute>
              <AvailabilityPageView />
            </ProtectedRoute>
          }
        />
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
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
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
        <Route path="/checkin/:id" element={<CheckInPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
}

export default App;
