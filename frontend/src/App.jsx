import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./store/authSlice";
import Login from "./pages/Login";
import CodeVerification from "./pages/CodeVerification";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Inventory from "./pages/Inventory";
import Reservations from "./pages/Reservations";
import CashierSessions from "./pages/CashierSessions";
import InvoicesPage from "./pages/InvoicesPage";
import UsersPage from "./pages/UsersPage";
import PrintInvoice from "./pages/PrintInvoice";
import { Armchair, FileText, DollarSign, Users, Clock } from "lucide-react";
import api from "./api/axios";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    activeSessions: 0,
    dailyRevenue: 0,
    totalInvoicesToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch active reservations count
        const resRes = await api.get("/reservations/active");
        const activeCount = resRes.data.length;

        // For admin, fetch today's invoices
        let dailyRevenue = 0;
        let totalInvoicesToday = 0;
        if (user?.role === "admin") {
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          try {
            const invRes = await api.get(`/invoices/by-day/${today}`);
            dailyRevenue = invRes.data.dayTotal || 0;
            totalInvoicesToday = invRes.data.invoices?.length || 0;
          } catch {
            // No invoices today
          }
        }

        setStats({ activeSessions: activeCount, dailyRevenue, totalInvoicesToday });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-cafe-teal mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-cafe-deep rounded-xl p-5 border border-cafe-mid">
          <div className="flex items-center gap-3 mb-2">
            <Armchair className="text-green-400" size={24} />
            <span className="text-cafe-gray text-sm">Active Sessions</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.activeSessions}
          </p>
        </div>
        {user?.role === "admin" && (
          <>
            <div className="bg-cafe-deep rounded-xl p-5 border border-cafe-mid">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-yellow-400" size={24} />
                <span className="text-cafe-gray text-sm">Today's Revenue</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.dailyRevenue.toLocaleString()}{" "}
                <span className="text-sm font-normal text-cafe-gray">SYP</span>
              </p>
            </div>
            <div className="bg-cafe-deep rounded-xl p-5 border border-cafe-mid">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-blue-400" size={24} />
                <span className="text-cafe-gray text-sm">
                  Invoices Today
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.totalInvoicesToday}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Quick Access */}
      <h2 className="text-lg font-semibold text-cafe-gray mb-3">
        Quick Access
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/reservations"
          className="bg-cafe-deep rounded-xl p-6 border border-cafe-mid hover:border-cafe-teal transition-colors"
        >
          <Armchair className="text-cafe-teal mb-3" size={28} />
          <h3 className="font-semibold text-lg">Reservations</h3>
          <p className="text-sm text-cafe-gray mt-1">
            Manage active sessions
          </p>
        </a>
        {user?.role === "admin" && (
          <>
            <a
              href="/invoices"
              className="bg-cafe-deep rounded-xl p-6 border border-cafe-mid hover:border-cafe-teal transition-colors"
            >
              <FileText className="text-cafe-teal mb-3" size={28} />
              <h3 className="font-semibold text-lg">Invoices</h3>
              <p className="text-sm text-cafe-gray mt-1">
                View daily invoices
              </p>
            </a>
            <a
              href="/inventory"
              className="bg-cafe-deep rounded-xl p-6 border border-cafe-mid hover:border-cafe-teal transition-colors"
            >
              <DollarSign className="text-cafe-teal mb-3" size={28} />
              <h3 className="font-semibold text-lg">Inventory & Pricing</h3>
              <p className="text-sm text-cafe-gray mt-1">
                Products & settings
              </p>
            </a>
          </>
        )}
      </div>
    </div>
  );
};

// Layout wrapper that adds sidebar for authenticated pages
const AuthLayout = ({ children, allowedRoles }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <Sidebar>{children}</Sidebar>
  </ProtectedRoute>
);

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light">
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/code" element={<CodeVerification />} />

        {/* Print route - no sidebar */}
        <Route path="/print-invoice/:id" element={<PrintInvoice />} />

        {/* Protected routes with sidebar */}
        <Route
          path="/"
          element={
            <AuthLayout allowedRoles={["admin", "cashier"]}>
              <Dashboard />
            </AuthLayout>
          }
        />
        <Route
          path="/reservations"
          element={
            <AuthLayout allowedRoles={["admin", "cashier"]}>
              <Reservations />
            </AuthLayout>
          }
        />
        <Route
          path="/inventory"
          element={
            <AuthLayout allowedRoles={["admin"]}>
              <Inventory />
            </AuthLayout>
          }
        />
        <Route
          path="/invoices"
          element={
            <AuthLayout allowedRoles={["admin"]}>
              <InvoicesPage />
            </AuthLayout>
          }
        />
        <Route
          path="/cashier-sessions"
          element={
            <AuthLayout allowedRoles={["admin"]}>
              <CashierSessions />
            </AuthLayout>
          }
        />
        <Route
          path="/users"
          element={
            <AuthLayout allowedRoles={["admin"]}>
              <UsersPage />
            </AuthLayout>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
