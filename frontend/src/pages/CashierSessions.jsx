import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Clock, UserCheck, X, Plus } from "lucide-react";
import api from "../api/axios";

const CashierSessions = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashierId, setSelectedCashierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const { user } = useSelector((state) => state.auth);

  const fetchActiveSession = async () => {
    try {
      const res = await api.get("/auth/cashier-sessions/active");
      setActiveSession(res.data.session);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCashiers = async () => {
    try {
      const res = await api.get("/users");
      setCashiers(res.data.filter((u) => u.role === "cashier" && u.isActive));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cashiers");
    }
  };

  useEffect(() => {
    fetchActiveSession();
    fetchCashiers();
  }, []);

  // Live countdown for time remaining
  useEffect(() => {
    if (!activeSession) {
      setTimeRemaining("");
      return;
    }
    const updateTime = () => {
      const now = new Date();
      const expires = new Date(activeSession.expiresAt);
      const diff = expires - now;
      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(
        `${hours}h ${mins.toString().padStart(2, "0")}m ${secs
          .toString()
          .padStart(2, "0")}s`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedCashierId) {
      toast.error("Select a cashier");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/cashier-sessions", {
        cashierId: selectedCashierId,
      });
      toast.success(`Session created! Code: ${res.data.code}`, {
        duration: 8000,
      });
      setSelectedCashierId("");
      fetchActiveSession();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm("End this cashier session?")) return;
    try {
      await api.post(`/auth/cashier-sessions/${sessionId}/end`);
      toast.success("Session ended");
      fetchActiveSession();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end session");
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

        {/* Active Session */}
        {activeSession ? (
          <div className="bg-cafe-deep rounded-xl p-6 mb-8 border border-green-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-semibold">Active Session</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-cafe-gray text-sm">Cashier</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <UserCheck size={18} className="text-cafe-teal" />
                  {activeSession.cashierId?.username}
                </p>
              </div>
              <div>
                <p className="text-cafe-gray text-sm">Session Code</p>
                <p className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">
                  {activeSession.code}
                </p>
              </div>
              <div>
                <p className="text-cafe-gray text-sm">Started At</p>
                <p>
                  {new Date(activeSession.startedAt).toLocaleString("en-GB")}
                </p>
              </div>
              <div>
                <p className="text-cafe-gray text-sm">Time Remaining</p>
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-cafe-teal" />
                  <span
                    className={`font-mono font-semibold ${
                      timeRemaining === "Expired"
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {timeRemaining}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleEndSession(activeSession._id)}
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center gap-2"
            >
              <X size={16} /> End Session
            </button>
          </div>
        ) : (
          <div className="bg-cafe-deep rounded-xl p-6 mb-8 border border-cafe-mid">
            <p className="text-cafe-gray">No active cashier session.</p>
          </div>
        )}

        {/* Create New Session */}
        <div className="bg-cafe-deep rounded-xl p-6 border border-cafe-mid">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus size={20} /> Create New Session
          </h2>
          {activeSession && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 mb-4 text-yellow-300 text-sm">
              ⚠ Creating a new session will automatically end the current one
              and log out the active cashier.
            </div>
          )}
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-cafe-gray">
                Select Cashier
              </label>
              <select
                value={selectedCashierId}
                onChange={(e) => setSelectedCashierId(e.target.value)}
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required
              >
                <option value="">-- Select cashier --</option>
                {cashiers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.username}
                  </option>
                ))}
              </select>
            </div>
            {cashiers.length === 0 && (
              <p className="text-sm text-cafe-gray">
                No cashier accounts found.{" "}
                <a href="/users" className="text-cafe-teal underline">
                  Create one first
                </a>
                .
              </p>
            )}
            <button
              type="submit"
              disabled={loading || cashiers.length === 0}
              className="bg-cafe-teal hover:bg-cafe-mid px-6 py-2 rounded font-semibold disabled:opacity-50"
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
