import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  X,
  Coffee,
} from "lucide-react";

const OnHouseAllPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [days, setDays] = useState([]);
  const [expandedDays, setExpandedDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editDesc, setEditDesc] = useState("");

  const fetchAll = async () => {
    try {
      const res = await api.get("/on-house");
      setDays(res.data.days || []);
    } catch (err) {
      toast.error("Failed to load on-house invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleDay = (date) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this on-house entry? Stock will be restored. Logged."
      )
    )
      return;
    try {
      await api.delete(`/on-house/${id}`);
      toast.success("Deleted, stock restored");
      fetchAll();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/on-house/${editModal._id}`, {
        description: editDesc,
      });
      toast.success("Updated");
      setEditModal(null);
      fetchAll();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="text-center mt-10 text-red-500">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-cafe-teal flex items-center gap-2 mb-2">
          <Coffee /> All On-House Invoices
        </h1>
        <p className="text-cafe-gray text-sm mb-6">
          All hospitality entries across all staff. Cost values shown are NOT
          part of cafe revenue.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : days.length === 0 ? (
          <div className="text-center py-10 text-cafe-gray bg-cafe-deep rounded-xl border border-cafe-mid">
            No on-house entries yet.
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day) => (
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
                        className="px-5 py-3 border-b border-cafe-mid/30 last:border-b-0 hover:bg-cafe-mid/5"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">
                                For:{" "}
                                <span className="text-cafe-teal">
                                  {inv.forUserId?.username || "?"}
                                </span>{" "}
                                <span className="text-xs text-cafe-gray">
                                  ({inv.forUserId?.role || "?"})
                                </span>
                              </span>
                              <span className="text-xs bg-cafe-mid/40 px-2 py-0.5 rounded">
                                by {inv.recordedById?.username || "?"}
                              </span>
                            </div>
                            <div className="text-sm text-cafe-light mt-1">
                              {inv.items
                                .map((i) => `${i.name} ×${i.quantity}`)
                                .join(" • ")}
                            </div>
                            {inv.description && (
                              <div className="text-xs text-cafe-gray mt-1 italic">
                                "{inv.description}"
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-yellow-400">
                              {Math.round(inv.totalCost).toLocaleString()} SYP
                            </span>
                            <button
                              onClick={() => {
                                setEditModal(inv);
                                setEditDesc(inv.description || "");
                              }}
                              className="text-cafe-light hover:text-white"
                              title="Edit description"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(inv._id)}
                              className="text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      {/* Edit modal (description only for simplicity) */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit On-House Entry</h2>
              <button onClick={() => setEditModal(null)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="text-sm text-cafe-gray">
                For:{" "}
                <span className="text-cafe-teal">
                  {editModal.forUserId?.username}
                </span>
              </div>
              <div>
                <label className="block text-sm mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows="3"
                  className="w-full p-2 rounded bg-black border border-cafe-mid text-white resize-none"
                  maxLength={300}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cafe-teal text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnHouseAllPage;
