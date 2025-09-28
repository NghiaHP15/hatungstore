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

    let query = supabase.from('shippings').select(`
        *,
        items:shipping_orders(
          *,
          invoice:invoices(
            *,
            customer:customers(*),
            items:invoice_items( *, 
              product_unit:product_units(*) 
            )
          )
        )
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('shipping_code', `%${search.toUpperCase()}%`);
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

    const { data: shippings, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      shippings,
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
    const { supabase } = await requireRole();

    const body = await request.json();
    const { status, note, items } = body;

    // Create shipping
    const { data: shipping, error: invoiceError } = await supabase
      .from('shippings')
      .insert({
        shipping_code: generateInvoiceNumber(),
        status,
        note,
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 400 });
    }

    // Create shipping items
    const shippingItems = items.map((item: any) => ({
      shipping_id: shipping.id,
      invoice_id: item.invoice_id,
      prioritized: item.prioritized,
    }));

    const { error: itemsError } = await supabase
      .from('shipping_orders')
      .insert(shippingItems);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    // Update invoice status
    const invoiceIds = items.map((item: any) => item.invoice_id);

    const { error: updateInvoiceError } = await supabase
      .from("invoices")
      .update({ status: true })
      .in("id", invoiceIds);

    if (updateInvoiceError) {
      return NextResponse.json({ error: updateInvoiceError.message }, { status: 400 });
    }

    return NextResponse.json(shipping, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
