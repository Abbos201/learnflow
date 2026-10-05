import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;

  // Admin login sahifasi ochiq bo'lishi kerak.
  const isAdminLogin = path === '/admin';

  // Admin ichki sahifalari himoyalangan.
  const isAdminProtected =
    path.startsWith('/admin/') && !isAdminLogin;

  // Student sahifalari himoyalangan.
  const isStudentProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/courses');

  // Admin ichki sahifasiga login qilmagan odam kirsa,
  // /login ga emas, /admin ga yuboramiz.
  if (!user && isAdminProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Student sahifalariga login qilmagan odam kirsa,
  // student loginiga yuboramiz.
  if (!user && isStudentProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  // Login qilgan odam student /login sahifasiga qaytib qolmasin.
  if (user && (path === '/login' || path === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};