import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/superbaseServer";

export async function middleware(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Danh sách route không cần đăng nhập
  const publicPaths = ["/auth", "/public", "/about"];

  const isPublic = publicPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 🔒 Nếu chưa login mà vào trang không phải public → redirect về /auth/login
  if (!isPublic && !session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 🔄 Nếu đã login mà vào /auth/* → redirect về /dashboard
  if (pathname.startsWith("/auth") && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], // chạy cho mọi route trừ file tĩnh
};
