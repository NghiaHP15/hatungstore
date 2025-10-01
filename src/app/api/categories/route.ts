import { createServerSupabase } from '@/lib/superbaseServer';
import { NextRequest, NextResponse } from 'next/server';

// GET categories (có phân trang + search)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase() // ✅ dùng server client
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const search = searchParams.get('search') || ''

    let query = supabase.from('categories').select('*', { count: 'exact' })

    if (search) {
      query = query.ilike('name_normalized', `%${search}%`)
    }

    const { data: categories, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      categories,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST category (chỉ admin, manager được thêm)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase() // ✅ phải await

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔎 Kiểm tra quyền
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 📥 Lấy dữ liệu từ body
    const body = await request.json()
    const { name, description } = body

    const { data: category, error } = await supabase
      .from('categories')
      .insert({ name, description })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
