/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ReportProduct } from "@/app/types";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";

export function exportProductDailyExcel(
  data: ReportProduct[],
  fromDate?: string,
  toDate?: string
) {
  const sheetData: any[][] = [];

  // ===== Title =====
  sheetData.push([
    "BÁO CÁO SẢN PHẨM THEO NGÀY",
  ]);
  sheetData.push([
    fromDate && toDate
      ? `Từ ${fromDate || ""} đến ${toDate || ""}`
      : "",
  ]);
  sheetData.push([]);

  // ===== Header =====
  sheetData.push([
    "#",
    "Tên sản phẩm",
    "Số lượng bán",
    "Số đơn hàng",
    "Số khách hàng",
    "Doanh thu (VNĐ)",
  ]);

  // ===== Data =====
  let totalRevenue = 0;

  data.forEach((item, index) => {
    totalRevenue += item.total_revenue;

    sheetData.push([
      index + 1,
      item.product_name,
      item.total_quantity_sold,
      item.total_orders,
      item.total_customers,
      formatCurrency(item.total_revenue),
    ]);
  });

  // ===== Total Row =====
  sheetData.push([
    "",
    "TỔNG TIỀN",
    "",
    "",
    "",
    formatCurrency(totalRevenue),
  ]);

  // ===== Create worksheet =====
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // ===== Merge cells =====
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // date range
    { s: { r: sheetData.length - 1, c: 1 }, e: { r: sheetData.length - 1, c: 4 } }, // total label
  ];

  // ===== Column width =====
  ws["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

//   // ===== Format currency =====
//   for (let r = 4; r < sheetData.length; r++) {
//     const cell = ws[XLSX.utils.encode_cell({ r, c: 3 })];
//     if (cell) {
//       cell.t = "n";
//       cell.z = '#,##0 "đ"';
//     }
//   }

  // ===== Create workbook =====
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Doanh thu");

  XLSX.writeFile(
    wb,
    `bao_cao_san_pham_${fromDate || ""}_${toDate || ""}.xlsx`
  );
}
