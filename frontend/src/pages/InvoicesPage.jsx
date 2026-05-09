import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Printer,
  Edit,
  Trash2,
  Plus,
  X,
} from "lucide-react";

const InvoicesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState({});
  const [showManualModal, setShowManualModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [manualForm, setManualForm] = useState({
    chairNumbers: "",
    type: "single",
    internetType: "standard",
    startedAt: "",
    endedAt: "",
    discountPercent: 0,
  });
  const [editForm, setEditForm] = useState({ discountPercent: 0 });

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices");
      setDays(res.data.days || []);
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const toggleDay = (date) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleReprint = (invoiceId) => {
    window.open(`/print-invoice/${invoiceId}`, "_blank");
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm("Delete this invoice? This action is logged.")) return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const chairArray = manualForm.chairNumbers
        .split(",")
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n));
      await api.post("/invoices/manual", {
        chairNumbers: chairArray,
        type: manualForm.type,
        internetType: manualForm.internetType,
        startedAt: manualForm.startedAt,
        endedAt: manualForm.endedAt,
        discountPercent: Number(manualForm.discountPercent),
        items: [],
      });
      toast.success("Manual invoice created");
      setShowManualModal(false);
      setManualForm({
        chairNumbers: "",
        type: "single",
        internetType: "standard",
        startedAt: "",
        endedAt: "",
        discountPercent: 0,
      });
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/invoices/${editModal._id}`, {
        discountPercent: Number(editForm.discountPercent),
      });
      toast.success("Invoice updated");
      setEditModal(null);
      fetchInvoices();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const formatCurrency = (num) => {
    return Math.round(num).toLocaleString();
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cafe-teal">Invoices</h1>
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Manual Invoice
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : days.length === 0 ? (
          <div className="text-center py-10 text-cafe-gray">
            No invoices yet.
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day) => (
              <div
                key={day.date}
                className="bg-cafe-deep rounded-xl border border-cafe-mid overflow-hidden"
              >
                {/* Day header */}
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
                      ({day.count} invoice{day.count > 1 ? "s" : ""})
                    </span>
                  </div>
                  <span className="text-cafe-teal font-bold">
                    {formatCurrency(day.dayTotal)} SYP
                  </span>
                </button>

                {/* Expanded invoices */}
                {expandedDays[day.date] && (
                  <div className="border-t border-cafe-mid">
                    {day.invoices.map((inv) => (
                      <div
                        key={inv._id}
                        className="px-5 py-3 border-b border-cafe-mid/30 last:border-b-0 hover:bg-cafe-mid/5"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold">
                                {inv.invoiceNumber}
                              </span>
                              <span className="text-xs bg-cafe-mid/40 px-2 py-0.5 rounded">
                                Chair {inv.chairNumbers.join(",")}
                              </span>
                              <span className="text-xs bg-cafe-mid/40 px-2 py-0.5 rounded">
                                {inv.type} / {inv.internetType || "standard"}
                              </span>
                            </div>
                            <div className="text-xs text-cafe-gray mt-1">
                              {inv.durationMinutes} min ({inv.billedUnits}{" "}
                              units) • Time: {formatCurrency(inv.timeCost)} +
                              Items: {formatCurrency(inv.itemsCost)}
                              {inv.discountPercent > 0 && (
                                <span className="text-yellow-400">
                                  {" "}
                                  • Discount: {inv.discountPercent}% (-
                                  {formatCurrency(inv.discountAmount)})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-cafe-teal">
                              {formatCurrency(inv.total)} SYP
                            </span>
                            <button
                              onClick={() => handleReprint(inv._id)}
                              className="text-cafe-light hover:text-white"
                              title="Reprint"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditModal(inv);
                                setEditForm({
                                  discountPercent: inv.discountPercent,
                                });
                              }}
                              className="text-cafe-light hover:text-white"
                              title="Edit"
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

      {/* Manual Invoice Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manual Invoice</h2>
              <button onClick={() => setShowManualModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Chair numbers (e.g., 5 or 5,6)"
                value={manualForm.chairNumbers}
                onChange={(e) =>
                  setManualForm({ ...manualForm, chairNumbers: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                required
              />
              <select
                value={manualForm.type}
                onChange={(e) =>
                  setManualForm({ ...manualForm, type: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="manual">Manual</option>
              </select>
              <select
                value={manualForm.internetType}
                onChange={(e) =>
                  setManualForm({ ...manualForm, internetType: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
              >
                <option value="standard">Standard Internet</option>
                <option value="premium">Premium Internet</option>
              </select>
              <div>
                <label className="block text-sm mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={manualForm.startedAt}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, startedAt: e.target.value })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={manualForm.endedAt}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, endedAt: e.target.value })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Discount %</label>
                <input
                  type="number"
                  value={manualForm.discountPercent}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      discountPercent: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cafe-teal"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Edit {editModal.invoiceNumber}
              </h2>
              <button onClick={() => setEditModal(null)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Discount %</label>
                <input
                  type="number"
                  value={editForm.discountPercent}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      discountPercent: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cafe-teal"
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

export default InvoicesPage;
