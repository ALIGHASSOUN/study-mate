import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchMe } from "./store/authSlice";
import Login from "./pages/Login";
import CodeVerification from "./pages/CodeVerification";
import ProtectedRoute from "./components/ProtectedRoute";
import Inventory from "./pages/Inventory";
import Reservations from "./pages/Reservations";
import CashierSessions from "./pages/CashierSessions";
import PrintInvoice from "./pages/PrintInvoice";

const Home = () => (
  <div className="min-h-screen bg-cafe-dark text-cafe-light p-8">
    <h1 className="text-2xl font-bold text-cafe-teal">Dashboard</h1>
    <p>Welcome to Study Cafe System.</p>
  </div>
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
        <Route path="/login" element={<Login />} />
        <Route path="/login/code" element={<CodeVerification />} />
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "cashier"]}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute allowedRoles={["admin", "cashier"]}>
              <Reservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier-sessions"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CashierSessions />
            </ProtectedRoute>
          }
        />
        <Route path="/print-invoice/:id" element={<PrintInvoice />} />
      </Routes>
    </div>
  );
}

export default App;
