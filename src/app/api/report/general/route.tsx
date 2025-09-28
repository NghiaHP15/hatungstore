/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabase } from '@/lib/superbaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Lấy ngày đầu tháng và cuối tháng hiện tại
    const now = new Date();
    const startOfDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Tổng đơn hàng theo ngày
    const { data: totalInvoices, error: revenueError } = await supabase
      .from("invoices")
      .select("id, status", { count: "exact" })
      .gte("created_at", startOfDate.toISOString())
      .lte("created_at", endOfDate.toISOString());

    if (revenueError) throw revenueError;

    return NextResponse.json({
      totalInvoices: totalInvoices.length,
      invoiceDelivered: totalInvoices.filter((invoice: any) => invoice.status === true).length,
      invoicePending: totalInvoices.filter((invoice: any) => invoice.status === false).length
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}