import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/superbaseAdmin';
import { createServerSupabase } from '@/lib/superbaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Lấy user hiện tại
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lấy profile tương ứng
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ profile });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireRole(['admin', 'manager', 'cashier']);
    const supabase = supabaseAdmin;

      const body = await req.json();
      const { email, full_name, role, password } = body;
  
      if(email || password) {
          const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
              email,
              password,
          })
          if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
      }
  
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name, role, email })
        .eq("id", user.id)
        .select()
        .single();
  
  
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
}

