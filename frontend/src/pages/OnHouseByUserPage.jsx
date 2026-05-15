import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Coffee,
  User as UserIcon,
  Shield,
} from "lucide-react";

const OnHouseByUserPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDays, setUserDays] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  const fetchSummary = async () => {
    try {
      const res = await api.get("/on-house/summary");
      setSummary(res.data || []);
    } catch (err) {
      toast.error("Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchByUser = async (userId) => {
    try {
      const res = await api.get(`/on-house/by-user/${userId}`);
      setUserDays(res.data.days || []);
      setUserInfo(res.data.user);
      setSelectedUser(userId);
    } catch (err) {
      toast.error("Failed to load user data");
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const toggleDay = (date) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const back = () => {
    setSelectedUser(null);
    setUserDays([]);
    setUserInfo(null);
    setExpandedDays({});
  };

  if (user?.role !== "admin") {
    return (
      <div className="text-center mt-10 text-red-500">
        Access denied. Admins only.
      </div>
    );
  }

  // --- Detail view: a selected user ---
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={back}
            className="flex items-center gap-2 text-cafe-teal hover:text-white mb-4"
          >
            <ArrowLeft size={18} /> Back to staff list
          </button>

          <h1 className="text-3xl font-bold text-cafe-teal flex items-center gap-2 mb-2">
            {userInfo?.role === "admin" ? <Shield /> : <UserIcon />}
            {userInfo?.username}{" "}
            <span className="text-sm text-cafe-gray font-normal">
              ({userInfo?.role})
            </span>
          </h1>
          <p className="text-cafe-gray text-sm mb-6">
            All on-house items received by this staff member.
          </p>

          {userDays.length === 0 ? (
            <div className="text-center py-10 text-cafe-gray bg-cafe-deep rounded-xl border border-cafe-mid">
              No on-house entries for this user.
            </div>
          ) : (
            <div className="space-y-3">
              {userDays.map((day) => (
                <div
                  key={day.date}
                  className="bg-cafe-deep rounded-xl border border-cafe-mid overflow-hidden"
                >
                  <button
                    onClick={() => toggleDay(day.date)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-cafe-mid/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedDays[day.date] ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                      <span className="font-semibold text-lg">
                        {new Date(day.date + "T12:00:00").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                      <span className="text-sm text-cafe-gray">
                        ({day.count} item{day.count > 1 ? "s" : ""})
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold">
                      {Math.round(day.dayCost).toLocaleString()} SYP
                    </span>
                  </button>

                  {expandedDays[day.date] && (
                    <div className="border-t border-cafe-mid">
                      {day.invoices.map((inv) => (
                        <div
                          key={inv._id}
                          className="px-5 py-3 border-b border-cafe-mid/30 last:border-b-0"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">
                                {inv.items
                                  .map((i) => `${i.name} ×${i.quantity}`)
                                  .join(" • ")}
                              </div>
                              <div className="text-xs text-cafe-gray mt-1">
                                Recorded by{" "}
                                {inv.recordedById?.username || "?"} •{" "}
                                {new Date(inv.createdAt).toLocaleTimeString(
                                  "en-GB",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </div>
                              {inv.description && (
                                <div className="text-xs text-cafe-gray italic mt-1">
                                  "{inv.description}"
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-yellow-400">
                              {Math.round(inv.totalCost).toLocaleString()} SYP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Summary view: cards ---
  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-cafe-teal flex items-center gap-2 mb-2">
          <Coffee /> On-House per Staff
        </h1>
        <p className="text-cafe-gray text-sm mb-6">
          Click a staff member's card to see their full on-house history.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : summary.length === 0 ? (
          <div className="text-center py-10 text-cafe-gray bg-cafe-deep rounded-xl border border-cafe-mid">
            No on-house entries recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((s) => (
              <button
                key={s.user._id}
                onClick={() => fetchByUser(s.user._id)}
                className="bg-cafe-deep rounded-xl p-5 border border-cafe-mid hover:border-cafe-teal transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {s.user.role === "admin" ? (
                      <Shield className="text-yellow-400" size={20} />
                    ) : (
                      <UserIcon className="text-cafe-teal" size={20} />
                    )}
                    <span className="font-bold text-lg">
                      {s.user.username}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-cafe-mid/40">
                    {s.user.role}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cafe-gray">Entries:</span>
                    <span className="font-semibold">{s.totalInvoices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cafe-gray">Total cost:</span>
                    <span className="font-bold text-yellow-400">
                      {Math.round(s.totalCost).toLocaleString()} SYP
                    </span>
                  </div>
                  {s.lastDate && (
                    <div className="flex justify-between text-xs">
                      <span className="text-cafe-gray">Last:</span>
                      <span className="text-cafe-light">{s.lastDate}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnHouseByUserPage;
