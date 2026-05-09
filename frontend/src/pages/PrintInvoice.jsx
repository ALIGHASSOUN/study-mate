import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

const PrintInvoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, setRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get("/settings"),
        ]);
        setInvoice(invRes.data);
        setSettings(setRes.data);
        // Auto print after short delay
        setTimeout(() => window.print(), 600);
      } catch (err) {
        setError("Failed to load invoice");
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8">Loading...</div>;

  const cafeName = settings?.cafeName || "Study Cafe";
  const cafePhone = settings?.cafePhone || "";
  const currency = settings?.currency || "SYP";

  const typeLabel =
    invoice.type === "manual"
      ? "Manual"
      : `${invoice.type === "single" ? "Single" : "Double"} / ${
          invoice.internetType === "premium" ? "Premium" : "Standard"
        }`;

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-area {
            max-width: 80mm;
            margin: 20px auto;
            border: 1px dashed #ccc;
            padding: 8px;
          }
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print" style={{ textAlign: "center", padding: "20px" }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 30px",
            fontSize: "16px",
            background: "#2D4A53",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Print Receipt
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: "10px 30px",
            fontSize: "16px",
            background: "#666",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      {/* Receipt Template */}
      <div
        className="print-area"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.4",
          color: "#000",
          background: "#fff",
          padding: "6px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>{cafeName}</div>
          {cafePhone && <div>{cafePhone}</div>}
          <div
            style={{
              borderBottom: "1px dashed #000",
              margin: "6px 0",
            }}
          />
        </div>

        {/* Invoice Info */}
        <div style={{ marginBottom: "6px" }}>
          <div>
            <strong>Invoice:</strong> {invoice.invoiceNumber}
          </div>
          <div>
            <strong>Date:</strong>{" "}
            {new Date(invoice.endedAt).toLocaleDateString("en-GB")}
          </div>
          <div>
            <strong>Time:</strong>{" "}
            {new Date(invoice.startedAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {new Date(invoice.endedAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div>
            <strong>Chair:</strong> {invoice.chairNumbers.join(", ")}
          </div>
          <div>
            <strong>Type:</strong> {typeLabel}
          </div>
          <div>
            <strong>Duration:</strong> {invoice.durationMinutes} min (
            {invoice.billedUnits} units)
          </div>
        </div>

        <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }} />

        {/* Items Table */}
        {invoice.items && invoice.items.length > 0 && (
          <>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", paddingBottom: "4px" }}>
                    Item
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      paddingBottom: "4px",
                      width: "30px",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      paddingBottom: "4px",
                      width: "60px",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}
            />
          </>
        )}

        {/* Totals */}
        <div style={{ fontSize: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Time cost:</span>
            <span>
              {Math.round(invoice.timeCost).toLocaleString()} {currency}
            </span>
          </div>
          {invoice.itemsCost > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Items cost:</span>
              <span>
                {Math.round(invoice.itemsCost).toLocaleString()} {currency}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #000",
              paddingTop: "4px",
              marginTop: "4px",
            }}
          >
            <span>Subtotal:</span>
            <span>
              {Math.round(invoice.subtotal).toLocaleString()} {currency}
            </span>
          </div>
          {invoice.discountPercent > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#666",
              }}
            >
              <span>Discount ({invoice.discountPercent}%):</span>
              <span>
                -{Math.round(invoice.discountAmount).toLocaleString()}{" "}
                {currency}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "14px",
              borderTop: "2px solid #000",
              paddingTop: "4px",
              marginTop: "4px",
            }}
          >
            <span>TOTAL:</span>
            <span>
              {Math.round(invoice.total).toLocaleString()} {currency}
            </span>
          </div>
        </div>

        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "#666",
          }}
        >
          <div>Thank you for your visit!</div>
          <div style={{ marginTop: "2px", fontSize: "10px" }}>
            {new Date().toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintInvoice;
