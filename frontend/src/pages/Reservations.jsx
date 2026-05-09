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
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/cashier-sessions/active", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.session) setCashierSessionId(data.session._id);
      } catch (err) {
        console.error(err);
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
        const minutes = Math.floor(diffMs / 60000);
        const remainderMinutes = minutes % 10;
        let billedUnits = Math.floor(minutes / 10);
        if (remainderMinutes >= 7) billedUnits += 1;
        const cost = billedUnits * (res.pricePerHour / 6);
        newTimes[res._id] = { minutes, cost: cost.toFixed(2) };
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
      0,
    );
    let subtotal = timeCost + itemsCost;
    let discountAmt = 0;
    if (applyDiscount && discountPercent > 0) {
      discountAmt = (subtotal * discountPercent) / 100;
    }
    const total = subtotal - discountAmt;
    setSubtotalPreview({ timeCost, itemsCost, subtotal, discountAmt, total });
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
        }),
      ).unwrap();
      toast.success("Reservation created");
      setShowNewModal(false);
      setNewReservation({
        chairNumbers: "",
        type: "single",
        internetType: "standard",
      });
    } catch (err) {
      toast.error(err.message || "Failed to create reservation");
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
        }),
      ).unwrap();
      toast.success("Item added");
      setSelectedProduct(null);
      setQuantity(1);
      setShowOrderModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to add item");
    }
  };

  const handleRemoveItem = async (reservationId, itemId) => {
    if (window.confirm("Remove this item?")) {
      await dispatch(removeItem({ id: reservationId, itemId }));
      toast.success("Item removed, stock restored");
    }
  };

  const handleCloseReservation = async () => {
    try {
      const invoice = await dispatch(
        closeReservation({
          id: showEndModal._id,
          applyDiscount,
          discountPercent: applyDiscount ? discountPercent : 0,
        }),
      ).unwrap();
      toast.success("Session closed");
      setShowEndModal(null);
      window.open(`/print-invoice/${invoice._id}`, "_blank");
    } catch (err) {
      toast.error(err);
    }
  };

  if (user?.role !== "admin" && user?.role !== "cashier")
    return <div className="text-center mt-10 text-red-500">Access denied.</div>;

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cafe-teal">
            Active Reservations
          </h1>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded"
          >
            + New Reservation
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {!loading && active.length === 0 && (
          <div className="text-center py-10 text-cafe-light">
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
                  <h2 className="text-xl font-bold">
                    Chair {res.chairNumbers.join(", ")}
                    <span className="ml-2 text-sm bg-cafe-mid px-2 py-1 rounded">
                      {res.type === "single" ? "Single" : "Double"} /{" "}
                      {res.internetType === "standard" ? "Standard" : "Premium"}
                    </span>
                  </h2>
                  <p className="text-cafe-light text-sm">
                    Started: {new Date(res.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono">
                    {elapsedTimes[res._id]?.minutes || 0} min
                  </p>
                  <p className="text-cafe-teal font-bold">
                    {elapsedTimes[res._id]?.cost || "0"} SYP
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Coffee size={18} /> Orders
                </h3>
                {res.items.length === 0 && (
                  <p className="text-sm text-cafe-light">No items yet.</p>
                )}
                <ul className="space-y-1 mt-2">
                  {res.items.map((item) => (
                    <li
                      key={item._id}
                      className="flex justify-between items-center border-b border-cafe-mid/30 py-1"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <div>
                        <span className="mr-3">
                          {item.price * item.quantity} SYP
                        </span>
                        <button
                          onClick={() => handleRemoveItem(res._id, item._id)}
                          className="text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowOrderModal(res)}
                  className="mt-3 text-cafe-teal hover:underline text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Add order
                </button>
                <button
                  onClick={() => {
                    setShowEndModal(res);
                    setApplyDiscount(res.discountPercent > 0);
                    setDiscountPercent(res.discountPercent);
                  }}
                  className="mt-2 ml-3 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  End Session
                </button>
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
              <input
                type="text"
                placeholder="Chair numbers (e.g., 5 or 5,6)"
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
              <select
                value={newReservation.type}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, type: e.target.value })
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
              >
                <option value="single">Single Chair</option>
                <option value="double">Double Chair (2 adjacent)</option>
              </select>
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
                <option value="standard">Standard Internet</option>
                <option value="premium">Premium Internet</option>
              </select>
              <button
                type="submit"
                className="w-full bg-cafe-teal py-2 rounded"
              >
                Create
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
                Add Order - Chair {showOrderModal.chairNumbers.join(",")}
              </h2>
              <button onClick={() => setShowOrderModal(null)}>
                <X />
              </button>
            </div>
            <div className="space-y-4">
              <select
                onChange={(e) =>
                  setSelectedProduct(
                    products.find((p) => p._id === e.target.value),
                  )
                }
                className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - {p.price} SYP (stock: {p.stock})
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
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full p-2 rounded bg-cafe-mid/30 border border-cafe-mid"
                  />
                  <button
                    onClick={handleAddItem}
                    className="w-full bg-cafe-teal py-2 rounded"
                  >
                    Add to order
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
            <h2 className="text-xl font-bold mb-4">Close Session</h2>
            <div className="space-y-2 mb-4">
              <p>Time cost: {subtotalPreview.timeCost.toFixed(2)} SYP</p>
              <p>Items cost: {subtotalPreview.itemsCost.toFixed(2)} SYP</p>
              <p>Subtotal: {subtotalPreview.subtotal.toFixed(2)} SYP</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={applyDiscount}
                  onChange={(e) => setApplyDiscount(e.target.checked)}
                />
                Apply discount
              </label>
              {applyDiscount && (
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-2 rounded bg-cafe-mid/30"
                  placeholder="Discount %"
                />
              )}
              <p className="text-lg font-bold">
                Total: {subtotalPreview.total.toFixed(2)} SYP
              </p>
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
                className="px-4 py-2 bg-cafe-teal rounded"
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
