import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

const CashierSessions = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashierId, setSelectedCashierId] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const fetchActiveSession = async () => {
    try {
      const res = await fetch("/api/auth/cashier-sessions/active", {
        credentials: "include",
      });
      const data = await res.json();
      setActiveSession(data.session);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCashiers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      const data = await res.json();
      setCashiers(data.filter((u) => u.role === "cashier" && u.isActive));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cashiers");
    }
  };

  useEffect(() => {
    fetchActiveSession();
    fetchCashiers();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedCashierId) {
      toast.error("Select a cashier");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/cashier-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cashierId: selectedCashierId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Session created. Code: ${data.code}`);
        fetchActiveSession();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm("End this session?")) return;
    try {
      const res = await fetch(`/api/auth/cashier-sessions/${sessionId}/end`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Session ended");
        fetchActiveSession();
      } else {
        toast.error("Failed to end session");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (user?.role !== "admin")
    return (
      <div className="text-center mt-10 text-red-500">
        Access denied. Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cafe-teal mb-6">
          Cashier Sessions
        </h1>

        {activeSession ? (
          <div className="bg-cafe-deep rounded-xl p-6 mb-8 border border-cafe-mid">
            <h2 className="text-xl font-semibold mb-2">Active Session</h2>
            <p>
              <strong>Cashier:</strong> {activeSession.cashierId?.username}
            </p>
            <p>
              <strong>Session Code:</strong> {activeSession.code}
            </p>
            <p>
              <strong>Expires at:</strong>{" "}
              {new Date(activeSession.expiresAt).toLocaleString()}
            </p>
            <button
              onClick={() => handleEndSession(activeSession._id)}
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              End Session
            </button>
          </div>
        ) : (
          <div className="bg-cafe-deep rounded-xl p-6 mb-8 border border-cafe-mid">
            <p className="text-cafe-light">No active cashier session.</p>
          </div>
        )}

        <div className="bg-cafe-deep rounded-xl p-6 border border-cafe-mid">
          <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <select
              value={selectedCashierId}
              onChange={(e) => setSelectedCashierId(e.target.value)}
              className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
              required
            >
              <option value="">Select cashier</option>
              {cashiers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.username}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Session"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CashierSessions;
