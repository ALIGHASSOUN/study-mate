import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Coffee, Plus, X, Trash2 } from "lucide-react";

const OnHousePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [todayInvoices, setTodayInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [showModal, setShowModal] = useState(false);
  const [forUserId, setForUserId] = useState("");
  const [description, setDescription] = useState("");
  const [cart, setCart] = useState([]); // [{ productId, name, price, quantity }]
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  const fetchAll = async () => {
    try {
      const [prodRes, staffRes] = await Promise.all([
        api.get("/products"),
        api.get("/users/staff"),
      ]);
      setProducts(prodRes.data || []);
      setStaff(staffRes.data || []);

      // Try to fetch today's on-house list (only admin can see all)
      // For cashier, this endpoint requires admin, so we silently skip
      if (user?.role === "admin") {
        try {
          const allRes = await api.get("/on-house");
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const todayDay = (allRes.data.days || []).find(
            (d) => d.date === todayStr
          );
          setTodayInvoices(todayDay?.invoices || []);
        } catch {
          setTodayInvoices([]);
        }
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addToCart = () => {
    if (!selectedProductId) {
      toast.error("Pick a product");
      return;
    }
    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return;
    const qty = parseInt(selectedQty) || 1;
    if (qty < 1) return;
    if (qty > product.stock) {
      toast.error(`Only ${product.stock} in stock`);
      return;
    }
    // If already in cart, increase qty
    const existing = cart.find((c) => c.productId === product._id);
    if (existing) {
      if (existing.quantity + qty > product.stock) {
        toast.error(`Only ${product.stock} in stock`);
        return;
      }
      setCart(
        cart.map((c) =>
          c.productId === product._id
            ? { ...c, quantity: c.quantity + qty }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: qty,
        },
      ]);
    }
    setSelectedProductId("");
    setSelectedQty(1);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((c) => c.productId !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!forUserId) {
      toast.error("Select a staff member");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    try {
      await api.post("/on-house", {
        forUserId,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
        })),
        description,
      });
      toast.success("On-house invoice created");
      setShowModal(false);
      setForUserId("");
      setDescription("");
      setCart([]);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-light p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-cafe-teal flex items-center gap-2">
            <Coffee /> On House
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-cafe-teal hover:bg-cafe-mid px-4 py-2 rounded flex items-center gap-2 text-white"
          >
            <Plus size={18} /> New On-House
          </button>
        </div>

        <p className="text-cafe-gray text-sm mb-6">
          Record hospitality items (drinks, snacks) given to staff. These are
          NOT counted in cafe revenue but inventory is deducted.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : user?.role === "admin" ? (
          <>
            <h2 className="text-xl font-semibold mb-3">Today's On-House</h2>
            {todayInvoices.length === 0 ? (
              <div className="text-cafe-gray text-center py-6 bg-cafe-deep rounded-xl border border-cafe-mid">
                No on-house entries today yet.
              </div>
            ) : (
              <div className="space-y-2">
                {todayInvoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="bg-cafe-deep border border-cafe-mid rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
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
                          <span className="text-xs text-cafe-gray">
                            • by {inv.recordedById?.username || "?"}
                          </span>
                          <span className="text-xs text-cafe-gray">
                            • {formatTime(inv.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm text-cafe-light mt-1">
                          {inv.items
                            .map((i) => `${i.name} x${i.quantity}`)
                            .join(" • ")}
                        </div>
                        {inv.description && (
                          <div className="text-xs text-cafe-gray mt-1 italic">
                            "{inv.description}"
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-cafe-gray">Cost value</div>
                        <div className="font-bold text-yellow-400">
                          {Math.round(inv.totalCost).toLocaleString()} SYP
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-cafe-deep border border-cafe-mid rounded-xl p-6 text-center text-cafe-gray">
            Use the "New On-House" button above to record hospitality items.
            Admin can view the full history.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-lg border border-cafe-mid max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-cafe-teal">
                New On-House Entry
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCart([]);
                  setForUserId("");
                  setDescription("");
                }}
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* For Whom */}
              <div>
                <label className="block text-sm mb-1 font-semibold">
                  For (staff member) *
                </label>
                <select
                  value={forUserId}
                  onChange={(e) => setForUserId(e.target.value)}
                  className="w-full p-2 rounded bg-black border border-cafe-mid text-white"
                  required
                >
                  <option value="">-- Select staff --</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.username} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Item picker */}
              <div className="bg-cafe-dark border border-cafe-mid rounded-lg p-3">
                <label className="block text-sm mb-2 font-semibold">
                  Add items *
                </label>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 min-w-[180px] p-2 rounded bg-black border border-cafe-mid text-white"
                  >
                    <option value="">-- Pick a product --</option>
                    {products.map((p) => (
                      <option
                        key={p._id}
                        value={p._id}
                        disabled={p.stock <= 0}
                      >
                        {p.name} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-20 p-2 rounded bg-black border border-cafe-mid text-white"
                  />
                  <button
                    type="button"
                    onClick={addToCart}
                    className="bg-cafe-teal hover:bg-cafe-mid text-white px-3 rounded"
                  >
                    Add
                  </button>
                </div>

                {/* Cart */}
                {cart.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {cart.map((c) => (
                      <div
                        key={c.productId}
                        className="flex items-center justify-between bg-cafe-deep rounded px-3 py-2 text-sm"
                      >
                        <span>
                          {c.name} × {c.quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-cafe-light">
                            {(c.price * c.quantity).toLocaleString()} SYP
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(c.productId)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-cafe-mid pt-2 mt-2 text-sm">
                      <span className="font-semibold">Cost value:</span>
                      <span className="font-bold text-yellow-400">
                        {cartTotal.toLocaleString()} SYP
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-1 font-semibold">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="e.g., Coffee for the morning shift"
                  className="w-full p-2 rounded bg-black border border-cafe-mid text-white resize-none"
                  maxLength={300}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setCart([]);
                    setForUserId("");
                    setDescription("");
                  }}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cafe-teal hover:bg-cafe-mid text-white"
                >
                  Save On-House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnHousePage;
