/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

type Params = { id: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const { supabase } = await requireRole([]); // ai cũng đọc được
  const { data, error } = await supabase.from("shippings").select("*").eq("id", id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireRole();
    const body = await request.json();
    const { status, note, items } = body;
    const shippingId = id;

    // 1. Update shipping info
    const { data: shipping, error: shippingError } = await supabase
      .from("shippings")
      .update({ status, note })
      .eq("id", shippingId)
      .select()
      .single();

    if (shippingError) {
      return NextResponse.json({ error: shippingError.message }, { status: 400 });
    }

    // 2. Lấy shipping_orders cũ
    const { data: oldOrders, error: oldOrdersError } = await supabase
      .from("shipping_orders")
      .select("invoice_id")
      .eq("shipping_id", shippingId);

    if (oldOrdersError) {
      return NextResponse.json({ error: oldOrdersError.message }, { status: 400 });
    }

    const oldInvoiceIds = oldOrders?.map((o) => o.invoice_id) || [];
    const newInvoiceIds = items.map((i: any) => i.invoice_id);

    // 3. Xóa shipping_orders cũ
    const { error: deleteError } = await supabase
      .from("shipping_orders")
      .delete()
      .eq("shipping_id", shippingId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 4. Thêm shipping_orders mới
    const shippingItems = items.map((item: any) => ({
      shipping_id: shippingId,
      invoice_id: item.invoice_id,
      prioritized: item.prioritized,
    }));

    const { error: insertError } = await supabase
      .from("shipping_orders")
      .insert(shippingItems);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 5. Cập nhật invoices:
    // - Những invoice_id có trong newInvoices -> status = true
    // - Những invoice_id cũ mà không còn trong newInvoices -> status = false
    const removedInvoiceIds = oldInvoiceIds.filter(
      (oldId) => !newInvoiceIds.includes(oldId)
    );

    // cập nhật true cho invoices mới
    if (newInvoiceIds.length > 0) {
      const { error: invoiceUpdateTrueError } = await supabase
        .from("invoices")
        .update({ status: true })
        .in("id", newInvoiceIds);

      if (invoiceUpdateTrueError) {
        return NextResponse.json({ error: invoiceUpdateTrueError.message }, { status: 400 });
      }
    }

    // cập nhật false cho invoices bị bỏ
    if (removedInvoiceIds.length > 0) {
      const filteredRemovedInvoiceIds = removedInvoiceIds.filter((id): id is string => id !== null);
      if (filteredRemovedInvoiceIds.length > 0) {
        const { error: invoiceUpdateFalseError } = await supabase
          .from("invoices")
          .update({ status: false })
          .in("id", filteredRemovedInvoiceIds);

        if (invoiceUpdateFalseError) {
          return NextResponse.json({ error: invoiceUpdateFalseError.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json(shipping, { status: 200 });
  } catch (error) {
    console.error("Update shipping error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireRole(); // chỉ admin, manager
    const { error } = await supabase.from("shippings").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}