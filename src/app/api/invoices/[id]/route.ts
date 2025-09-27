import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

type Params = { id: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const { supabase } = await requireRole([]); // ai cũng đọc được
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}