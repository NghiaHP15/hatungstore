import { createServerSupabase } from '@/lib/superbaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Lấy ngày đầu tháng và cuối tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Tổng doanh thu theo orders
    const { data: totalRevenueData, error: revenueError } = await supabase
      .from("invoices")
      .select("total_amount, id", { count: "exact" })
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    if (revenueError) throw revenueError;

    const totalRevenue = totalRevenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

    // Tổng sản phẩm bán ra trong tháng
    const { data: totalProductsData, error: productsError } = await supabase
      .from("invoice_items")
      .select("quantity")
      .in(
        "invoice_id",
        totalRevenueData?.map((invoice) => invoice.id) || []
      );

    if (productsError) throw productsError;

    const totalProducts = totalProductsData?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

    // Tổng khách hàng
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    // Tổng đơn hàng
    const totalOrders = totalRevenueData?.length || 0;

    return NextResponse.json({
      totalRevenue,
      totalProducts,
      totalCustomers,
      totalOrders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}