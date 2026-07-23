import PDFDocument from "pdfkit";
import { Response } from "express";

interface ChallanItem {
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number | string;
}

interface ChallanData {
  challanNumber: string;
  date: Date | string;
  status: string;
  customerName: string;
  customerMobile?: string;
  createdByName?: string;
  items: ChallanItem[];
}

export function generateChallanPdf(challan: ChallanData, res: Response) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=challan-${challan.challanNumber}.pdf`
  );
  doc.pipe(res);

  doc.fontSize(20).text("VertexERP", { align: "left" });
  doc.fontSize(10).text("Delivery Challan", { align: "left" }).moveDown();

  doc
    .fontSize(12)
    .text(`Challan No: ${challan.challanNumber}`)
    .text(`Date: ${new Date(challan.date).toLocaleDateString()}`)
    .text(`Status: ${challan.status}`)
    .moveDown();

  doc.fontSize(12).text(`Customer: ${challan.customerName}`);
  if (challan.customerMobile) doc.text(`Mobile: ${challan.customerMobile}`);
  if (challan.createdByName) doc.text(`Prepared by: ${challan.createdByName}`);
  doc.moveDown();

  const tableTop = doc.y + 10;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Product", 50, tableTop);
  doc.text("SKU", 220, tableTop);
  doc.text("Qty", 320, tableTop);
  doc.text("Unit Price", 380, tableTop);
  doc.text("Total", 470, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  doc.font("Helvetica").fontSize(10);
  let y = tableTop + 25;
  let grandTotal = 0;

  challan.items.forEach((item) => {
    const unitPrice = Number(item.unitPrice);
    const lineTotal = item.quantity * unitPrice;
    grandTotal += lineTotal;

    doc.text(item.productName, 50, y, { width: 160 });
    doc.text(item.productSku, 220, y);
    doc.text(String(item.quantity), 320, y);
    doc.text(unitPrice.toFixed(2), 380, y);
    doc.text(lineTotal.toFixed(2), 470, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
  doc.font("Helvetica-Bold").text(`Grand Total: ${grandTotal.toFixed(2)}`, 380, y + 15);

  doc.end();
}