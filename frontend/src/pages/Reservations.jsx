import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActiveReservations,
  createReservation,
  addItem,
  removeItem,
  closeReservation,
} from "../store/reservationSlice";
import { fetchProducts } from "../store/productSlice";
import toast from "react-hot-toast";
import { Coffee, Plus, Trash2, X } from "lucide-react";
import api from "../api/axios";

const Reservations = () => {
  const dispatch = useDispatch();
  const { active, loading } = useSelector((state) => state.reservations);
  const { items: products } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [newReservation, setNewReservation] = useState({
    chairNumbers: "",
    type: "single",
    internetType: "standard",
  });
  const [cashierSessionId, setCashierSessionId] = useState(null);

  // State for End Session modal
  const [showEndModal, setShowEndModal] = useState(null);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [subtotalPreview, setSubtotalPreview] = useState({
    timeCost: 0,
    itemsCost: 0,
    subtotal: 0,
    discountAmt: 0,
    total: 0,
  });

  useEffect(() => {
    dispatch(fetchActiveReservations());
    dispatch(fetchProducts());

    // Fetch active cashier session using api instance (not raw fetch)
    const fetchSession = async () => {
      try {
        const res = await api.get("/auth/cashier-sessions/active");
        if (res.data.session) {
          setCashierSessionId(res.data.session._id);
        }
      } catch (err) {
        console.error("Could not fetch cashier session:", err.message);
      }
    };
    fetchSession();
  }, [dispatch]);

  // Live elapsed time and cost update
  const [elapsedTimes, setElapsedTimes] = useState({});
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes = {};
      active.forEach((res) => {
        const start = new Date(res.startedAt);
        const now = new Date();
        const diffMs = now - start;
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const remainderMinutes = totalMinutes % 10;
        let billedUnits = Math.floor(totalMinutes / 10);
        if (remainderMinutes >= 7) billedUnits += 1;
        const cost = billedUnits * (res.pricePerHour / 6);
        newTimes[res._id] = {
          minutes: totalMinutes,
          display: `${hours}h ${mins}m`,
          cost: Math.round(cost),
        };
      });
      setElapsedTimes(newTimes);
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  // Preview total when opening end modal
  useEffect(() => {
    if (showEndModal) {
      calculatePreview(showEndModal);
    }
  }, [showEndModal, applyDiscount, discountPercent]);

  const calculatePreview = (reservation) => {
    const start = new Date(reservation.startedAt);
    const now = new Date();
    const minutes = Math.floor((now - start) / 60000);
    const remainder = minutes % 10;
    let billedUnits = Math.floor(minutes / 10);
    if (remainder >= 7) billedUnits += 1;
    const timeCost = billedUnits * (reservation.pricePerHour / 6);
    const itemsCost = reservation.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let subtotal = timeCost + itemsCost;
    let discountAmt = 0;
    if (applyDiscount && discountPercent > 0) {
      discountAmt = (subtotal * discountPercent) / 100;
    }
    const total = subtotal - discountAmt;
    setSubtotalPreview({
      timeCost: Math.round(timeCost),
      itemsCost,
      subtotal: Math.round(subtotal),
      discountAmt: Math.round(discountAmt),
      total: Math.round(total),
      billedUnits,
      minutes,
    });
  };

  const handleNewReservation = async (e) => {
    e.preventDefault();
    if (!cashierSessionId) {
      toast.error("No active cashier session. Please ask admin to create one.");
      return;
    }
    const chairArray = newReservation.chairNumbers
      .split(",")
      .map((n) => parseInt(n.trim()));
    if (chairArray.some(isNaN)) {
      toast.error("Enter valid chair numbers separated by comma");
      return;
    }
    try {
      await dispatch(
        createReservation({
          chairNumbers: chairArray,
          type: newReservation.type,
          internetType: newReservation.internetType,
          cashierSessionId,
        })
      ).unwrap();
      toast.success("Reservation created");
      setShowNewModal(false);
      setNewReservation({
        chairNumbers: "",
        type: "single",
        internetType: "standard",
      });
    } catch (err) {
      toast.error(err.message || err || "Failed to create reservation");
    }
  };

  const handleAddItem = async () => {
    if (!selectedProduct) return;
    try {
      await dispatch(
        addItem({
          id: showOrderModal._id,
          productId: selectedProduct._id,
          quantity,
        })
      ).unwrap();
      toast.success("Item added");
      setSelectedProduct(null);
      setQuantity(1);
      setShowOrderModal(null);
    } catch (err) {
      toast.error(err.message || err || "Failed to add item");
    }
  };

  const handleRemoveItem = async (reservationId, itemId) => {
    if (window.confirm("Remove this item?")) {
      try {
        await dispatch(removeItem({ id: reservationId, itemId })).unwrap();
        toast.success("Item removed, stock restored");
      } catch (err) {
        toast.error(err.message || "Failed to remove item");
      }
    }
  };

  const handleCloseReservation = async () => {
    try {
      // payload الآن: { invoice, closedReservationId }
      const result = await dispatch(
        closeReservation({
          id: showEndModal._id,
          applyDiscount,
          discountPercent: applyDiscount ? discountPercent : 0,
        })
      ).unwrap();
      toast.success("Session closed");
      setShowEndModal(null);
      // Open print page
      window.open(`/print-invoice/${result.invoice._id}`, "_blank");
    } catch (err) {
      toast.error(err || "Failed to close session");
    }
  };

  const getTypeBadgeColor = (type, internetType) => {
    if (internetType === "premium") {
      return type === "double"
        ? "bg-purple-500/20 text-purple-300"
        : "bg-yellow-500/20 text-yellow-300";
    }
    return type === "double"
      ? "bg-blue-500/20 text-blue-300"
      : "bg-cafe-mid/40 text-cafe-light";
  };

  if (user?.role !== "admin" && user?.role !== "cashier")
    return (
      <div className="text-center mt-10 text-red-500">Access denied.</div>
    );

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cafe-teal">
            Active Reservations
          </h1>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> New Reservation
          </button>
        </div>

        {!cashierSessionId && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 mb-4 text-yellow-300 text-sm">
            ⚠ No active cashier session detected. Ask admin to create one before
            starting reservations.
          </div>
        )}

        {loading && <p>Loading...</p>}
        {!loading && active.length === 0 && (
          <div className="text-center py-10 text-cafe-gray">
            No active reservations.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {active.map((res) => (
            <div
              key={res._id}
              className="bg-cafe-deep rounded-xl p-5 border border-cafe-mid shadow-lg"
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                    Chair {res.chairNumbers.join(", ")}
                    <span
                      className={`text-xs px-2 py-1 rounded ${getTypeBadgeColor(
                        res.type,
                        res.internetType
                      )}`}
                    >
                      {res.type === "single" ? "Single" : "Double"} /{" "}
                      {res.internetType === "standard" ? "Standard" : "Premium"}
                    </span>
                  </h2>
                  <p className="text-cafe-gray text-sm mt-1">
                    Started: {new Date(res.startedAt).toLocaleTimeString()} •{" "}
                    {res.pricePerHour.toLocaleString()} SYP/hr
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono text-white">
                    {elapsedTimes[res._id]?.display || "0h 0m"}
                  </p>
                  <p className="text-cafe-teal font-bold text-lg">
                    {(elapsedTimes[res._id]?.cost || 0).toLocaleString()} SYP
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm text-cafe-gray">
                  <Coffee size={16} /> Orders
                </h3>
                {res.items.length === 0 ? (
                  <p className="text-sm text-cafe-gray/60 mt-1">
                    No items yet.
                  </p>
                ) : (
                  <ul className="space-y-1 mt-2">
                    {res.items.map((item) => (
                      <li
                        key={item._id}
                        className="flex justify-between items-center border-b border-cafe-mid/20 py-1 text-sm"
                      >
                        <span>
                          {item.name} ×{item.quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>
                            {(item.price * item.quantity).toLocaleString()} SYP
                          </span>
                          <button
                            onClick={() => handleRemoveItem(res._id, item._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowOrderModal(res)}
                    className="text-cafe-teal hover:text-white text-sm flex items-center gap-1 border border-cafe-teal/30 px-3 py-1 rounded hover:bg-cafe-teal/10"
                  >
                    <Plus size={14} /> Add Order
                  </button>
                  <button
                    onClick={() => {
                      setShowEndModal(res);
                      setApplyDiscount(res.discountPercent > 0);
                      setDiscountPercent(res.discountPercent);
                    }}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    End Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Reservation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Reservation</h2>
              <button onClick={() => setShowNewModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleNewReservation} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-cafe-gray">
                  Chair Number(s)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 5 or 5,6"
                  value={newReservation.chairNumbers}
                  onChange={(e) =>
                    setNewReservation({
                      ...newReservation,
                      chairNumbers: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-cafe-gray">
                  Chair Type
                </label>
                <select
                  value={newReservation.type}
                  onChange={(e) =>
                    setNewReservation({
                      ...newReservation,
                      type: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                >
                  <option value="single">Single Chair</option>
                  <option value="double">Double Chair (2 adjacent)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-cafe-gray">
                  Internet Type
                </label>
                <select
                  value={newReservation.internetType}
                  onChange={(e) =>
                    setNewReservation({
                      ...newReservation,
                      internetType: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                >
                  <option value="standard">Standard (بنت عادي)</option>
                  <option value="premium">Premium (بنت سريع)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-cafe-teal hover:bg-cafe-mid py-2 rounded font-semibold"
              >
                Create Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Add Order — Chair {showOrderModal.chairNumbers.join(",")}
              </h2>
              <button onClick={() => setShowOrderModal(null)}>
                <X />
              </button>
            </div>
            <div className="space-y-4">
              <select
                onChange={(e) =>
                  setSelectedProduct(
                    products.find((p) => p._id === e.target.value)
                  )
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                defaultValue=""
              >
                <option value="" disabled>
                  Select product
                </option>
                {products
                  .filter((p) => p.isActive && p.stock > 0)
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {p.price.toLocaleString()} SYP (stock:{" "}
                      {p.stock})
                    </option>
                  ))}
              </select>
              {selectedProduct && (
                <>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(parseInt(e.target.value) || 1)
                    }
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                  <button
                    onClick={handleAddItem}
                    className="w-full bg-cafe-teal hover:bg-cafe-mid py-2 rounded font-semibold"
                  >
                    Add to Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Close Session — Chair {showEndModal.chairNumbers.join(",")}
              </h2>
              <button onClick={() => setShowEndModal(null)}>
                <X />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="text-sm text-cafe-gray">
                Duration: {subtotalPreview.minutes} min (
                {subtotalPreview.billedUnits} billed units)
              </div>
              <div className="flex justify-between">
                <span>Time cost:</span>
                <span>{subtotalPreview.timeCost.toLocaleString()} SYP</span>
              </div>
              <div className="flex justify-between">
                <span>Items cost:</span>
                <span>{subtotalPreview.itemsCost.toLocaleString()} SYP</span>
              </div>
              <div className="flex justify-between border-t border-cafe-mid pt-2">
                <span>Subtotal:</span>
                <span>{subtotalPreview.subtotal.toLocaleString()} SYP</span>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={applyDiscount}
                  onChange={(e) => setApplyDiscount(e.target.checked)}
                  className="rounded"
                />
                <span>Apply discount</span>
              </label>
              {applyDiscount && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(Number(e.target.value))
                    }
                    className="w-24 p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                    placeholder="%"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm">%</span>
                  <span className="text-sm text-yellow-400 ml-auto">
                    -{subtotalPreview.discountAmt.toLocaleString()} SYP
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-cafe-mid pt-2">
                <span>Total:</span>
                <span className="text-cafe-teal">
                  {subtotalPreview.total.toLocaleString()} SYP
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEndModal(null)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseReservation}
                className="px-4 py-2 bg-cafe-teal rounded font-semibold"
              >
                Confirm & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
