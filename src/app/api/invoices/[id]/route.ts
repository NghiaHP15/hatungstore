/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

type Params = { id: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  
  const { supabase } = await requireRole(['admin', 'manager']); 
  let query = supabase.from('invoices').select(`
        *,
        customer:customers(*),
        items:invoice_items(
          *,
          product_unit:product_units(*, product:products(*))
        )
    `, { count: 'exact' });

    if(id) {
      query = query.eq('id', id);
    }

  const { data, error } = await query.single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id: _id } = await params;
    const { supabase, user } = await requireRole();

    const body = await request.json();
    const {
      id,
      customer_name,
      customer_phone,
      customer_address,
      items,
      status,
      payment_method,
      discount_amount = 0,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Tính tổng
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    );
    const total = subtotal - discount_amount;

    let customer_id: string | null = null;
    if (customer_name !== "") {
      const { data: existingCustomer, error: findError } = await supabase
        .from("customers")
        .select("*")
        .or(`name.eq.${customer_name}`)
        .maybeSingle();

      if (findError) {
        return NextResponse.json({ error: findError.message }, { status: 400 });
      }

      if (existingCustomer) {
        customer_id = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: customer_name,
            phone: customer_phone,
            address: customer_address,
          })
          .select()
          .single();

        if (customerError) {
          return NextResponse.json(
            { error: customerError.message },
            { status: 400 }
          );
        }

        customer_id = newCustomer.id;
      }
    }

    // Update invoice
    const { data: updatedInvoices, error: updateError } = await supabase
      .from("invoices")
      .update({
        total_amount: total,
        cashier_id: user.id,
        discount_amount,
        status,
        payment_method,
        customer_id,
      })
      .eq("id", id)
      .select();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log(updatedInvoices);
    

    const updatedInvoice = updatedInvoices?.[0];

    // Xoá items cũ
    const { error: deleteError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // Insert items mới
    const invoiceItems = items.map((item: any) => ({
      invoice_id: id,
      product_unit_id: item.product_unit_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    return NextResponse.json(updatedInvoice, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireRole(); // chỉ admin, manager
    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}