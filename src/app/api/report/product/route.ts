/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/superbaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    /* =====================================================
     * QUERY VIEW
     * ===================================================== */
    let query = supabase
      .from('invoice_items_report')
      .select('*', { count: "exact" });

    // lọc ngày
    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    // search sản phẩm
    if (search) {
      query = query.ilike('product_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    /* =====================================================
     * GROUP THEO SẢN PHẨM
     * ===================================================== */
    const map = new Map<string, any>();

    data?.forEach((item: any) => {
      const productId = item.product_unit_id;

      if (!map.has(productId)) {
        map.set(productId, {
          product_id: productId,
          product_name: item.product_name,
          product_name_normalized: item.product_name_normalized,
          total_quantity_sold: 0,
          total_revenue: 0,
          total_orders: new Set<string>(),
          total_customers: new Set<string>(),
        });
      }

      const record = map.get(productId);

      record.total_quantity_sold += item.quantity;
      record.total_revenue += item.total_price;
      record.total_orders.add(item.invoice_id);
      record.total_customers.add(item.customer_id);
    });

    const result = Array.from(map.values()).map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      product_name_normalized: r.product_name_normalized,
      total_quantity_sold: r.total_quantity_sold,
      total_revenue: r.total_revenue,
      total_orders: r.total_orders.size,
      total_customers: r.total_customers.size,
    }));

    /* =====================================================
     * PAGINATION
     * ===================================================== */
    const total = result.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    return NextResponse.json({
      data: result.slice(start, end),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
