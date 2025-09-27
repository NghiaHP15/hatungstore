/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { ProductUnit } from "@/app/types";

type Params = { id: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const { supabase } = await requireRole([]); // ai cũng đọc được
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireRole(); // chỉ admin, manager
    const body = await req.json();
    const { name, image_url, category_id, units } = body;

    // Cập nhật product
    const { data: product, error } = await supabase
      .from("products")
      .update({ name, image_url, category_id })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (product) {
      // Lấy danh sách units hiện tại trong DB
      const { data: existingUnits } = await supabase
        .from("product_units")
        .select("id")
        .eq("product_id", id);

      const existingIds = existingUnits?.map((u) => u.id) || [];
      const incomingIds = units.map((u: ProductUnit) => u.id).filter(Boolean);

      // Xóa những unit không còn trong payload
      const toDelete = existingIds.filter((dbId) => !incomingIds.includes(dbId));
      if (toDelete.length > 0) {
        await supabase.from("product_units").delete().in("id", toDelete);
      }

      // Thêm mới hoặc update
      await Promise.all(
        units.map(async (unit: ProductUnit) => {
            if(unit.unit_name !== "" && unit.price !== 0 && unit.name !== "") {
                if (unit.id && existingIds.includes(unit.id)) {
                  // Update
                  await supabase
                    .from("product_units")
                    .update({
                      name: unit.name,
                      unit_name: unit.unit_name,
                      price: unit.price,
                    })
                    .eq("id", unit.id);
                } else {
                  // Insert
                  await supabase.from("product_units").insert({
                    name: unit.name,
                    product_id: id,
                    unit_name: unit.unit_name,
                    price: unit.price,
                  });
                }
            }
        })
      );
    }

    return NextResponse.json(product);
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
    const { supabase } = await requireRole(); // chỉ admin, manager
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
