import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

const PrintInvoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data);
        setTimeout(() => window.print(), 500);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInvoice();
  }, [id]);

  if (!invoice) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4" style={{ width: "80mm", margin: "0 auto" }}>
      <h2 className="text-center font-bold">
        {invoice.cafeName || "Study Cafe"}
      </h2>
      <p className="text-center">Invoice: {invoice.invoiceNumber}</p>
      <p>Date: {new Date(invoice.endedAt).toLocaleString()}</p>
      <p>Chairs: {invoice.chairNumbers.join(", ")}</p>
      <p>
        Duration: {invoice.durationMinutes} min ({invoice.billedUnits} units)
      </p>
      <hr />
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <p>Time cost: {invoice.timeCost}</p>
      <p>Items cost: {invoice.itemsCost}</p>
      <p>Subtotal: {invoice.subtotal}</p>
      {invoice.discountPercent > 0 && (
        <p>
          Discount: {invoice.discountPercent}% (-{invoice.discountAmount})
        </p>
      )}
      <p className="font-bold">Total: {invoice.total}</p>
      <p className="text-center text-xs mt-4">Thank you!</p>
    </div>
  );
};

export default PrintInvoice;
