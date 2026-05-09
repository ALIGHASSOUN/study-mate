import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const CloseSessionModal = ({ reservation, isOpen, onClose, onConfirm }) => {
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(null);

  useEffect(() => {
    if (reservation && isOpen) {
      // استدعاء حساب تقديري (يمكن عمل API تقديري، لكن سنحسب لحظياً)
      const start = new Date(reservation.startedAt);
      const now = new Date();
      const minutes = Math.floor((now - start) / 60000);
      const remainder = minutes % 10;
      let units = Math.floor(minutes / 10);
      if (remainder >= 7) units++;
      const timeCost = units * (reservation.pricePerHour / 6);
      const itemsCost = reservation.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const subtotal = timeCost + itemsCost;
      const finalPercent = applyDiscount ? discountPercent : 0;
      const discountAmount = (subtotal * finalPercent) / 100;
      const total = subtotal - discountAmount;
      setCalculated({ subtotal, discountAmount, total });
    }
  }, [reservation, isOpen, applyDiscount, discountPercent]);

  const handleSubmit = async () => {
    if (!calculated) return;
    setLoading(true);
    try {
      await onConfirm(reservation._id, applyDiscount ? discountPercent : 0);
      toast.success("Session closed successfully");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !reservation) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-cafe-deep rounded-xl p-6 w-full max-w-md border border-cafe-mid">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Close Session - Chair {reservation.chairNumbers.join(",")}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {calculated && (
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{calculated.subtotal.toFixed(2)} SYP</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={(e) => setApplyDiscount(e.target.checked)}
              />
              <span>Apply discount</span>
              {applyDiscount && (
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-20 p-1 rounded bg-cafe-mid/30 border border-cafe-mid"
                  placeholder="%"
                />
              )}
            </div>
            {applyDiscount && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>{calculated.discountAmount.toFixed(2)} SYP</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{calculated.total.toFixed(2)} SYP</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-cafe-teal py-2 rounded"
        >
          Confirm & Close
        </button>
      </div>
    </div>
  );
};

export default CloseSessionModal;
