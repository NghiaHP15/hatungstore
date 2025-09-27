/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/superbaseAdmin";

type Params = { id: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const { supabase } = await requireRole();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    await requireRole(['admin']); 
    const supabase = supabaseAdmin;

    const body = await req.json();
    const { email, full_name, role, password } = body;

    if(email || password) {
        const { error: authError } = await supabase.auth.admin.updateUserById(id, {
            email,
            password,
        })
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name, role, email })
      .eq("id", id)
      .select()
      .single();


    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
    try {
    const { id } = await params;
    await requireRole(['admin']); 
    const supabase = supabaseAdmin;

    // Xóa user trong auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
