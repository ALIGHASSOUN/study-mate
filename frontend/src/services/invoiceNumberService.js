const Invoice = require("../models/Invoice");

const getNextInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  let nextNumber = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  const year = new Date().getFullYear();
  return `INV-${year}-${nextNumber.toString().padStart(5, "0")}`;
};

module.exports = { getNextInvoiceNumber };
