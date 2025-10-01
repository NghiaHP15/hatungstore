/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Danh sách ids không hợp lệ" },
        { status: 400 }
      );
    }

    const { supabase } = await requireRole();

    const { data, error } = await supabase
      .from("shippings")
      .update({ status })
      .in("id", ids)
      .select();

    if (error) {
      console.error("Update invoices error:", error);
      return NextResponse.json(
        { error: "Không thể cập nhật trạng thái" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Cập nhật trạng thái thành công", data },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}