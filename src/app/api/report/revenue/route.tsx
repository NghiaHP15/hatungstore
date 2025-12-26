/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabase } from '@/lib/superbaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    let query = supabase
      .from("invoice_daily")
      .select("*", { count: "exact" });

    if (start_date) {
      query = query.gte("date", start_date);
    }

    if (end_date) {
      query = query.lte("date", end_date);
    }

    const { data: report, error, count } = await query
      .order("date", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      report,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}