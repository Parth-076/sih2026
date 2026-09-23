import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import NewInspection from "./pages/NewInspection";
import InspectionDetail from "./pages/InspectionDetail";
import History from "./pages/History";
import Unauthorized from "./pages/Unauthorized";
import ComingSoon from "./pages/ComingSoon";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Any authenticated role */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inspections/new" element={<NewInspection />} />
            <Route path="/inspections/:id" element={<InspectionDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/products" element={<Products />} />
          </Route>
        </Route>

        {/* Admin-only */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AppShell />}>
            <Route
              path="/rules"
              element={
                <ComingSoon
                  title="Rules Management"
                  phaseNote="Compliance rule engine configuration arrives in Phase 9."
                />
              }
            />
            <Route
              path="/users"
              element={
                <ComingSoon
                  title="User Management"
                  phaseNote="Full admin user-management UI is planned for a later phase. The API (list/create/update users) is already live."
                />
              }
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
