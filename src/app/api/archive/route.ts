/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Parser } from "json2csv";
import zlib from "zlib";
import { supabaseAdmin } from "@/lib/superbaseAdmin";

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // 1. Lấy invoice > 3 tháng
    const { data: oldInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .lt(
        "created_at",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (fetchError) throw fetchError;
    if (!oldInvoices || oldInvoices.length === 0) {
      return NextResponse.json({ message: "Không có đơn hàng cần archive." });
    }

    const invoiceIds = oldInvoices.map((o) => o.id);

    // 2. Lấy invoice_items
    const { data: oldItems, error: fetchItemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", invoiceIds);

    if (fetchItemsError) throw fetchItemsError;

    // 3. Lấy shippings
    const { data: oldShippings, error: fetchShippingError } = await supabase
      .from("shippings")
      .select("*")
      .in("invoice_id", invoiceIds);

    if (fetchShippingError) throw fetchShippingError;

    // 4. Helper upload function
    const uploadCsvGzip = async (name: string, rows: any[]) => {
      if (!rows || rows.length === 0) return null;
      const parser = new Parser();
      const csv = parser.parse(rows);
      const compressed = zlib.gzipSync(csv);

      const fileName = `${name}_archive_${new Date()
        .toISOString()
        .split("T")[0]}.csv.gz`;

      const { error: uploadError } = await supabase.storage
        .from("archives")
        .upload(fileName, compressed, {
          contentType: "application/gzip",
          upsert: false,
        });

      if (uploadError) throw uploadError;
      return fileName;
    };

    // 5. Upload 3 bảng
    const invoiceFile = await uploadCsvGzip("invoices", oldInvoices);
    const itemsFile = await uploadCsvGzip("invoice_items", oldItems ?? []);
    const shippingFile = await uploadCsvGzip("shippings", oldShippings ?? []);

    // 6. Xoá dữ liệu theo thứ tự (items → shippings → invoices)
    if (oldItems && oldItems.length > 0) {
      const itemIds = oldItems.map((i) => i.id);
      const { error: deleteItemsError } = await supabase
        .from("invoice_items")
        .delete()
        .in("id", itemIds);
      if (deleteItemsError) throw deleteItemsError;
    }

    if (oldShippings && oldShippings.length > 0) {
      const shippingIds = oldShippings.map((s) => s.id);
      const { error: deleteShippingError } = await supabase
        .from("shippings")
        .delete()
        .in("id", shippingIds);
      if (deleteShippingError) throw deleteShippingError;
    }

    const { error: deleteInvoiceError } = await supabase
      .from("invoices")
      .delete()
      .in("id", invoiceIds);

    if (deleteInvoiceError) throw deleteInvoiceError;

    return NextResponse.json({
      message: `✅ Đã archive ${oldInvoices.length} invoices, ${oldItems?.length ?? 0} invoice_items và ${oldShippings?.length ?? 0} shippings.`,
      files: [invoiceFile, itemsFile, shippingFile].filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
