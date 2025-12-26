"use client";

import { ReportRevenue } from "@/app/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportInvoiceDailyPdf(
  data: ReportRevenue[],
  fromDate?: string,
  toDate?: string
) {
  const doc = new jsPDF();

  // ===== Title =====
  doc.setFontSize(16);
  doc.text("BÁO CÁO DOANH THU THEO NGÀY", 105, 15, {
    align: "center",
  });

  // ===== Date range =====
  doc.setFontSize(10);
  if (fromDate && toDate) {
    doc.text(`${fromDate} - ${toDate}`, 105, 22, {
      align: "center",
    });
  }

  // ===== Table data =====
  let totalRevenue = 0;

  const tableBody = data.map((item, index) => {
    totalRevenue += item.total_revenue;
    return [
      index + 1,
      item.date,
      item.total_orders,
      formatCurrency(item.cash_revenue),
      formatCurrency(item.transfer_revenue),
      formatCurrency(item.total_revenue),
    ];
  });

  // ===== Total row =====
  tableBody.push([
    "",
    "TOTAL",
    "",
    "",
    "",
    formatCurrency(totalRevenue),
  ]);

  // ===== Render table =====
  autoTable(doc, {
    startY: 30,
    head: [["#", "Date", "Count", "Cash", "Transfer",  "Revenue"]],
    body: tableBody,
    styles: {
      fontSize: 10,
      halign: "center",
    },
    headStyles: {
      fillColor: [22, 119, 255], // xanh Ant Design
      textColor: 255,
    },
    didParseCell: function (data) {
      // Bold dòng tổng tiền
      if (
        data.row.index === tableBody.length - 1
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ===== Footer =====
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.text(
    `Exported on: ${new Date().toLocaleDateString("vi-VN")}`,
    14,
    pageHeight - 10
  );

  // ===== Save =====
  doc.save(
    `bao_cao_doanh_thu_${fromDate || ""}_${toDate || ""}.pdf`
  );
}

// ===== Format tiền =====
function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN") + " đ";
}
