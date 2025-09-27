import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const id = 1;
  const { supabase } = await requireRole();
  const { data, error } = await supabase.from("store").select("*").eq("id", id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  try {
    const id = 1;
    const { supabase } = await requireRole(); 
    const body = await req.json();
    const { store, address, phone, email, owner, name_bank, number_bank, account_bank, qr_code } = body;

    const { data, error } = await supabase
      .from("store")
      .update({ store, address, phone, email, owner, name_bank, number_bank, account_bank, qr_code })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
