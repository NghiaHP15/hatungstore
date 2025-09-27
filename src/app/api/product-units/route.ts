import { requireRole } from '@/lib/auth';
import { createServerSupabase } from '@/lib/superbaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');

    let query = supabase
      .from('product_units')
      .select(`*,
        product:products!inner(id, name, image_url, category:categories(id, name))
      `, {
        count: 'exact',
      })

    if (search) {
      query = query.ilike('product.name_normalized', `%${search}%`);
    }

    if (category) {
      query = query.eq('product.category_id', category);
    }

    const { data: product_units, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      product_units,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireRole(); 

    const body = await request.json();
    const { unit_name, price, product_id, name } = body;

    const { data: product, error } = await supabase
      .from('product_units')
      .insert({
        name,
        unit_name, 
        price, 
        product_id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(product, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
