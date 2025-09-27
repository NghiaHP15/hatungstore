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
      .update({
        status,
        note,
      })
      .eq("id", shippingId)
      .select()
      .single();

    if (shippingError) {
      return NextResponse.json({ error: shippingError.message }, { status: 400 });
    }

    // 2. Delete old shipping_orders
    const { error: deleteError } = await supabase
      .from("shipping_orders")
      .delete()
      .eq("shipping_id", shippingId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 3. Insert new shipping_orders
    const shippingItems = items.map((item: any) => ({
      shipping_id: shippingId,
      invoice_id: item.invoice_id,
      priority: item.priority,
    }));

    const { error: insertError } = await supabase
      .from("shipping_orders")
      .insert(shippingItems);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 4. Update invoices status = true
    const invoiceIds = items.map((item: any) => item.invoice_id);

    const { error: invoiceUpdateError } = await supabase
      .from("invoices")
      .update({ status: true })
      .in("id", invoiceIds);

    if (invoiceUpdateError) {
      return NextResponse.json({ error: invoiceUpdateError.message }, { status: 400 });
    }

    return NextResponse.json(shipping, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
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