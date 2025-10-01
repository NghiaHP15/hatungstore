import { ProductUnit } from '@/app/types';
import { requireRole } from '@/lib/auth';
import { createServerSupabase } from '@/lib/superbaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');

    let query = supabase
      .from('products')
      .select(`*, category:categories(*), units:product_units(*)`, {
        count: 'exact',
      })

    if (search) {
      query = query.ilike('name_normalized', `%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    const { data: products, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      products,
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
    const { supabase } = await requireRole(['admin', 'manager']); 

    const body = await request.json();
    const {
      name,
      image_url,
      category_id,
      units
    } = body;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        image_url,
        category_id,
      })
      .select()
      .single();

    if (product) {
      await Promise.all(
        units.map(async (unit: ProductUnit) => {
          if(unit.unit_name !== "" && unit.price !== 0 && unit.name !== "") {
            await supabase
              .from('product_units')
              .insert({
                name: unit.name,
                product_id: product.id,
                unit_name: unit.unit_name,
                price: unit.price,
              });
          }
        })
      );
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(product, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
