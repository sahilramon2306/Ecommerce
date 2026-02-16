const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const generateInvoicePDF = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../invoices");
      if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

      const fileName = `invoice_${order.invoiceId}.pdf`;
      const filePath = path.join(invoicesDir, fileName);

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* ===== Fonts ===== */
      doc.registerFont("Regular", path.join(__dirname, "../fonts/NotoSans-Regular.ttf"));
      doc.registerFont("Bold", path.join(__dirname, "../fonts/NotoSans-Bold.ttf"));
      doc.font("Regular");

      const pageWidth = doc.page.width;
      const startX = 40;
      let y = 40;

      /* ===== SAFE ADDRESS VALUES (FIXED) ===== */
      const customerName =
        order.address?.fullName ||
        order.address?.name ||
        "Customer";

      const customerStreet =
        order.address?.street ||
        order.address?.addressLine ||
        "";

      const customerCity = order.address?.city || "";
      const customerState = order.address?.state || "";
      const customerPincode = order.address?.pincode || "";
      const customerPhone = order.address?.phone || "";

      /* ===== Header ===== */
      const logoPath = path.join(__dirname, "../assets/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, startX, y, { width: 80 });
      }

      doc.font("Bold").fontSize(22).text("INVOICE", startX + 110, y);

      doc.font("Regular").fontSize(10);
      doc.text(`Invoice ID: ${order.invoiceId}`, pageWidth - 220, y);
      doc.text(`Order ID: ${order._id}`, pageWidth - 220, y + 14);
      doc.text(`Date & Time: ${new Date(order.createdAt).toLocaleString()}`, pageWidth - 220, y + 28);

      doc.roundedRect(pageWidth - 130, y + 52, 80, 22, 4).fill("#e6f7ee");
      doc.fillColor("green").font("Bold").text("PAID", pageWidth - 110, y + 57);
      doc.fillColor("black").font("Regular");

      y += 100;

      /* ===== Customer Section (FIXED VALUES USED) ===== */
      doc.font("Bold").fontSize(12).text("Billed To", startX, y);
      y += 16;

      doc.font("Regular").fontSize(10);
      doc.text(customerName, startX, y);
      doc.text(customerStreet, startX, y + 14);
      doc.text(`${customerCity}, ${customerState} - ${customerPincode}`, startX, y + 28);
      doc.text(`Phone: ${customerPhone}`, startX, y + 42);

      y += 80;

      /* ===== PRODUCT TABLE (UNCHANGED) ===== */
      const rowHeight = 26;
      const tableWidth = pageWidth - startX * 2;

      const col = {
        sl: startX,
        product: startX + 40,
        qty: startX + 300,
        price: startX + 360,
        total: startX + 450
      };

      doc.rect(startX, y, tableWidth, rowHeight).stroke();
      doc.font("Bold").fontSize(11);

      doc.text("SL.", col.sl + 8, y + 8);
      doc.text("Product", col.product + 6, y + 8);
      doc.text("Qty", col.qty + 8, y + 8);
      doc.text("Price", col.price + 6, y + 8);
      doc.text("Total", col.total + 6, y + 8);

      [col.product, col.qty, col.price, col.total].forEach(x => {
        doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
      });

      y += rowHeight;
      doc.font("Regular").fontSize(10);

      order.items.forEach((item, index) => {
        doc.rect(startX, y, tableWidth, rowHeight).stroke();
        [col.product, col.qty, col.price, col.total].forEach(x => {
          doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
        });

        const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);

        doc.text(String(index + 1), col.sl + 10, y + 8);
        doc.text(item.productId?.name || "Product", col.product + 6, y + 8, { width: 230 });
        doc.text(String(item.quantity || 0), col.qty + 10, y + 8);
        doc.text(`₹ ${Number(item.price || 0).toFixed(2)}`, col.price + 6, y + 8);
        doc.text(`₹ ${lineTotal.toFixed(2)}`, col.total + 6, y + 8);

        y += rowHeight;
      });

      /* ===== Totals (UNCHANGED) ===== */
      const summaryX = col.qty;
      const summaryWidth = tableWidth - (summaryX - startX);

      doc.rect(summaryX, y, summaryWidth, rowHeight * 4).stroke();

      for (let i = 1; i <= 3; i++) {
        doc.moveTo(summaryX, y + rowHeight * i)
           .lineTo(summaryX + summaryWidth, y + rowHeight * i)
           .stroke();
      }

      const subtotal = Number(order.subTotal || 0);
      const cgstAmount = Number(order.cgstAmount || 0);
      const sgstAmount = Number(order.sgstAmount || 0);
      const grandTotal = Number(order.totalAmount || 0);

      doc.fontSize(11);

      doc.text("Subtotal:", summaryX + 10, y + 8);
      doc.text(`₹ ${subtotal.toFixed(2)}`, summaryX + summaryWidth - 90, y + 8);

      doc.text("CGST:", summaryX + 10, y + rowHeight + 8);
      doc.text(`₹ ${cgstAmount.toFixed(2)}`, summaryX + summaryWidth - 90, y + rowHeight + 8);

      doc.text("SGST:", summaryX + 10, y + rowHeight * 2 + 8);
      doc.text(`₹ ${sgstAmount.toFixed(2)}`, summaryX + summaryWidth - 90, y + rowHeight * 2 + 8);

      doc.font("Bold");
      doc.text("Grand Total:", summaryX + 10, y + rowHeight * 3 + 8);
      doc.text(`₹ ${grandTotal.toFixed(2)}`, summaryX + summaryWidth - 90, y + rowHeight * 3 + 8);

      y += rowHeight * 4 + 30;

      /* ===== QR Code (FIXED DATA) ===== */
      const qrData = JSON.stringify({
        invoiceId: order.invoiceId,
        orderId: order._id,
        amount: grandTotal,
        customer: customerName,
        phone: customerPhone
      });

      const qrImage = await QRCode.toDataURL(qrData);
      doc.image(qrImage, startX, y, { width: 90 });

      y += 100;
      doc.fontSize(10);
      doc.text("Paid via Razorpay", startX, y);
      doc.text("Thank you for shopping with Sahil's Ecommerce.", startX, y + 14);
      doc.text("This is a system-generated invoice.", startX, y + 28);

      doc.end();
      stream.on("finish", () => resolve({ filePath, fileName }));

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePDF;
