/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/superbaseServer';
import { generateInvoiceNumber } from '@/lib/utils';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let query = supabase.from('invoices').select(`
        *,
        customer:customers(*),
        cashier:profiles(*),
        items:invoice_items(
          *,
          product_unit:product_units(*)
        )
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('invoice_code', `%${search.toUpperCase()}%`);
    }

    if (status) {
      query = query.eq('status', status as any);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: invoices, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      invoices,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireRole();

    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      items,
      status,
      discount_amount = 0,
    } = body;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    );

    const total = subtotal - discount_amount;

    let customer_id: string | null = null;
    const checkCustomer = customer_name !== "" || customer_phone !== "";

    if (checkCustomer) {
      // Check if customer exists (ưu tiên theo số điện thoại)
      const { data: existingCustomer, error: findError } = await supabase
        .from("customers")
        .select("*")
        .or(`phone.eq.${customer_phone},name.eq.${customer_name}`)
        .maybeSingle();

      if (findError) {
        return NextResponse.json(
          { error: findError.message },
          { status: 400 }
        );
      }

      if (existingCustomer) {
        // Nếu đã tồn tại thì lấy id
        customer_id = existingCustomer.id;
      } else {
        // Nếu chưa tồn tại thì thêm mới
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

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_code: generateInvoiceNumber(),
        total_amount: total,
        cashier_id: user.id,
        discount_amount,
        status,
        customer_id,
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 400 });
    }

    // Create invoice items
    const invoiceItems = items.map((item: any) => ({
      invoice_id: invoice.id,
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

