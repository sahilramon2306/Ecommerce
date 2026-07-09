const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const CURRENCY = "\u20B9";

// SaaS-style color palette
const theme = {
  primary: "#4F46E5",    // Indigo 600 (Brand accent)
  textMain: "#0F172A",   // Slate 900 (Primary text)
  textMuted: "#64748B",  // Slate 500 (Secondary text)
  border: "#E2E8F0",     // Slate 200 (Subtle dividers)
  bgLight: "#F8FAFC",    // Slate 50 (Table header background)
  success: "#10B981"     // Emerald 500 (Paid badge)
};

const generateInvoicePDF = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../invoices");

      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `invoice_${order.invoiceId}.pdf`;
      const filePath = path.join(invoicesDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 20, left: 50, right: 50 },
        bufferPages: true,
        autoPageBreak: false 
      });

      const stream = fs.createWriteStream(filePath);
      stream.on("finish", () => resolve({ filePath, fileName }));
      stream.on("error", reject);

      doc.pipe(stream);

      const regularFontPath = path.join(__dirname, "../fonts/NotoSans-Regular.ttf");
      const boldFontPath = path.join(__dirname, "../fonts/NotoSans-Bold.ttf");

      const regularFont = fs.existsSync(regularFontPath) ? "Regular" : "Helvetica";
      const boldFont = fs.existsSync(boldFontPath) ? "Bold" : "Helvetica-Bold";

      if (fs.existsSync(regularFontPath)) doc.registerFont("Regular", regularFontPath);
      if (fs.existsSync(boldFontPath)) doc.registerFont("Bold", boldFontPath);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const startX = 50;
      const topY = 50;
      const bottomY = pageHeight - 70;
      const tableWidth = pageWidth - startX * 2;

      let y = topY;

      const table = {
        x: startX,
        width: tableWidth,
        headerHeight: 28,
        rowMinHeight: 32,
        columns: [
          { key: "sl", label: "SL.", x: startX, width: 30, align: "left" },
          { key: "product", label: "ITEM DESCRIPTION", x: startX + 30, width: 250, align: "left" },
          { key: "qty", label: "QTY", x: startX + 280, width: 50, align: "center" },
          { key: "price", label: "PRICE", x: startX + 330, width: 80, align: "right" },
          { key: "total", label: "TOTAL", x: startX + 410, width: 85, align: "right" }
        ]
      };

      const formatMoney = (value) =>
        Number(value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

      const formatDate = (value) => {
        const date = value ? new Date(value) : new Date();
        return Number.isNaN(date.getTime()) ? new Date().toLocaleString("en-IN") : date.toLocaleString("en-IN");
      };

      const truncateText = (value, maxLength = 140) => {
        const text = String(value || "").trim();
        return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
      };

      const drawTopAccent = () => {
        doc.save().rect(0, 0, pageWidth, 6).fill(theme.primary).restore();
      };

      const drawPageFooter = () => {
        const range = doc.bufferedPageRange();

        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          drawTopAccent();

          doc
            .moveTo(startX, pageHeight - 50)
            .lineTo(pageWidth - startX, pageHeight - 50)
            .lineWidth(0.5)
            .strokeColor(theme.border)
            .stroke();

          doc
            .font(regularFont)
            .fontSize(8)
            .fillColor(theme.textMuted)
            .text("SahimonCart Automated Billing System", startX, pageHeight - 35, {
              width: tableWidth,
              align: "center",
              lineBreak: false
            });
            
          doc.text(`Page ${i + 1} of ${range.count}`, startX, pageHeight - 35, {
              width: tableWidth,
              align: "right",
              lineBreak: false
          });
        }
      };

      const ensureSpace = (requiredHeight, repeatTableHeader = false) => {
        if (y + requiredHeight <= bottomY) return;
        doc.addPage();
        y = topY + 20;
        if (repeatTableHeader) drawTableHeader();
      };

      const drawHeader = () => {
        const logoPath = path.join(__dirname, "../assets/logo.png");
        
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, startX, y, { width: 75 });
          doc.font(regularFont).fontSize(9).fillColor(theme.textMuted);
        } else {
          doc.font(boldFont).fontSize(20).fillColor(theme.textMain).text("SahimonCart", startX, y);
          doc.font(regularFont).fontSize(9).fillColor(theme.textMuted);
        }

        const rightX = pageWidth - startX - 220; 
        
        doc.font(boldFont).fontSize(28).fillColor(theme.primary).text("INVOICE", rightX, y - 5, { width: 220, align: "right" });
        
        doc.font(regularFont).fontSize(9).fillColor(theme.textMuted);
        doc.text("Invoice Number:", rightX, y + 30, { width: 90 });
        doc.font(boldFont).fillColor(theme.textMain).text(order.invoiceId || "-", rightX + 90, y + 30, { width: 130, align: "right" });

        doc.font(regularFont).fillColor(theme.textMuted).text("Order ID:", rightX, y + 60, { width: 90 });
        doc.font(boldFont).fillColor(theme.textMain).text(String(order._id || "-"), rightX + 90, y + 60, { width: 130, align: "right" });

        doc.font(regularFont).fillColor(theme.textMuted).text("Date Issued:", rightX, y + 45, { width: 90 });
        doc.font(boldFont).fillColor(theme.textMain).text(formatDate(order.createdAt).split(',')[0], rightX + 90, y + 45, { width: 130, align: "right" });

        // Status Badge
        doc.save().roundedRect(pageWidth - startX - 55, y + 80, 55, 20, 4).fill(theme.success).restore();
        doc.font(boldFont).fontSize(9).fillColor("#FFFFFF").text("PAID", pageWidth - startX - 55, y + 86, { width: 55, align: "center" });

        y += 120;
      };

      const drawBillingSection = () => {
        const customerName = order.address?.fullName || order.address?.name || "Customer";
        const customerStreet = order.address?.street || order.address?.addressLine || "";
        const cityState = [order.address?.city, order.address?.state].filter(Boolean).join(", ");
        const pinPhone = [
            order.address?.pincode ? `PIN: ${order.address.pincode}` : null,
            order.address?.phone ? `Ph: ${order.address.phone}` : null
        ].filter(Boolean).join(" • ");

        doc.font(boldFont).fontSize(10).fillColor(theme.textMuted).text("BILLED TO", startX, y);
        y += 14;

        doc.font(boldFont).fontSize(12).fillColor(theme.textMain).text(customerName, startX, y);
        y += 16;

        doc.font(regularFont).fontSize(10).fillColor(theme.textMuted);
        if (customerStreet) { doc.text(customerStreet, startX, y); y += 14; }
        if (cityState) { doc.text(cityState, startX, y); y += 14; }
        if (pinPhone) { doc.text(pinPhone, startX, y); y += 14; }

        y += 30;
      };

      const drawTableHeader = () => {
        doc.save().roundedRect(table.x, y, table.width, table.headerHeight, 4).fill(theme.bgLight).restore();

        doc.font(boldFont).fontSize(8).fillColor(theme.textMuted);

        table.columns.forEach((column) => {
          doc.text(column.label, column.x + 5, y + 9, {
            width: column.width - 10,
            align: column.align
          });
        });

        y += table.headerHeight + 5;
      };

      const drawProductRow = (item, index) => {
        const productName = truncateText(item.productId?.name || item.name || "Product");
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const lineTotal = Number(item.totalPrice || price * quantity || 0);

        doc.font(regularFont).fontSize(9);
        const productTextHeight = doc.heightOfString(productName, { width: table.columns[1].width - 10 });
        const rowHeight = Math.max(table.rowMinHeight, productTextHeight + 15);

        ensureSpace(rowHeight, true);

        doc.fillColor(theme.textMain);
        
        doc.text(index + 1, table.columns[0].x + 5, y + 10, { width: table.columns[0].width - 10, align: "left" });
        doc.text(productName, table.columns[1].x + 5, y + 10, { width: table.columns[1].width - 10, align: "left" });
        doc.text(quantity, table.columns[2].x + 5, y + 10, { width: table.columns[2].width - 10, align: "center" });
        doc.text(`${CURRENCY} ${formatMoney(price)}`, table.columns[3].x + 5, y + 10, { width: table.columns[3].width - 10, align: "right" });
        doc.font(boldFont).text(`${CURRENCY} ${formatMoney(lineTotal)}`, table.columns[4].x + 5, y + 10, { width: table.columns[4].width - 10, align: "right" });

        y += rowHeight;

        doc.moveTo(startX, y).lineTo(startX + tableWidth, y).lineWidth(0.5).strokeColor(theme.border).stroke();
        y += 5;
      };

      const drawSummary = () => {
        // Fix: Ensure space for BOTH the summary and the QR code block simultaneously
        ensureSpace(160, false); 
        y += 10;
        
        // Capture the Y coordinate before drawing the summary to align the QR code perfectly
        const startY = y; 

        const summaryWidth = 220;
        const summaryX = startX + tableWidth - summaryWidth;

        const subtotal = Number(order.subTotal || 0);
        const cgstAmount = Number(order.cgstAmount || 0);
        const sgstAmount = Number(order.sgstAmount || 0);
        const grandTotal = Number(order.totalAmount || 0);

        const drawSummaryLine = (label, amount, isTotal = false) => {
            doc.font(isTotal ? boldFont : regularFont)
               .fontSize(isTotal ? 12 : 10)
               .fillColor(isTotal ? theme.primary : theme.textMuted)
               .text(label, summaryX, y, { width: 100 })
               .fillColor(isTotal ? theme.primary : theme.textMain)
               .text(`${CURRENCY} ${formatMoney(amount)}`, summaryX + 100, y, { width: summaryWidth - 100, align: "right" });
            y += isTotal ? 24 : 18;
        };

        drawSummaryLine("Subtotal", subtotal);
        drawSummaryLine("CGST (9%)", cgstAmount);
        drawSummaryLine("SGST (9%)", sgstAmount);
        
        y += 5;
        doc.moveTo(summaryX, y).lineTo(summaryX + summaryWidth, y).lineWidth(1).strokeColor(theme.border).stroke();
        y += 10;

        drawSummaryLine("Total Amount", grandTotal, true);

        // Return both the total and the captured starting Y position
        return { grandTotal, startY };
      };

      const drawQrAndThanks = async (grandTotal, startY) => {
        // Fix: No ensureSpace() call here. We already guaranteed the space in drawSummary().
        
        const customerName = order.address?.fullName || order.address?.name || "Customer";
        const customerPhone = order.address?.phone || "N/A";
        const subtotal = Number(order.subTotal || 0);
        const totalTax = Number(order.cgstAmount || 0) + Number(order.sgstAmount || 0);

        const qrPayloadText = `*** SAHIMONCART ***
Invoice Details
-------------------
Inv ID: ${order.invoiceId}
Order ID: ${String(order._id)}
Date: ${formatDate(order.createdAt).split(',')[0]}

Customer Info
-------------------
Name: ${customerName}
Phone: ${customerPhone}

Amount Summary
-------------------
Subtotal: Rs. ${formatMoney(subtotal)}
Tax (GST): Rs. ${formatMoney(totalTax)}
Grand Total: Rs. ${formatMoney(grandTotal)}`;

        const qrImage = await QRCode.toDataURL(qrPayloadText, { 
            errorCorrectionLevel: 'M',
            margin: 1,
            color: { dark: theme.textMain, light: '#ffffff' }
        });

        // Draw the QR image relative to the startY captured before the summary was drawn
        doc.image(qrImage, startX, startY, { width: 80 });

        doc.font(boldFont).fontSize(10).fillColor(theme.textMain).text("Payment Information", startX + 95, startY + 5);
        doc.font(regularFont).fontSize(9).fillColor(theme.textMuted)
           .text("Method: Razorpay Secure", startX + 95, startY + 20)
           .text("Transaction Status: Successful", startX + 95, startY + 35);

        // Move the global `y` pointer safely below both the summary and the QR code block
        y = Math.max(y, startY + 80) + 30;

        doc.font(regularFont).fontSize(10).fillColor(theme.textMuted).text("Thank you for choosing SahimonCart. We appreciate your business.", startX, y);
      };

      drawHeader();
      drawBillingSection();
      drawTableHeader();

      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item, index) => drawProductRow(item, index));

      // Execution updated to pass the startY coordinate
      const { grandTotal, startY } = drawSummary();
      await drawQrAndThanks(grandTotal, startY);

      drawPageFooter();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePDF;