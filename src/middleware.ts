import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip Supabase auth check if env vars are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // --- ESCAPE HATCH FOR FORCED LOGOUT ---
  // If the URL has logged_out=1, we aggressively clear the cookies and redirect to clean /login
  if (request.nextUrl.searchParams.get('logged_out') === '1') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('logged_out');
    const redirectResponse = NextResponse.redirect(url);
    
    // Manually delete all Supabase-related cookies
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });
    
    // Return immediately to drop the user out
    return redirectResponse;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Proteksi API routes agar tidak dapat diakses tanpa auth kecuali register/login
  if (path.startsWith('/api') && !path.startsWith('/api/auth') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user && (path.startsWith('/mahasiswa') || path.startsWith('/dosen') || path.startsWith('/admin') || path.startsWith('/kajur'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    // Redirect if accessing login/register while already authenticated
    if (path === '/login' || path === '/register') {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) {
        return NextResponse.redirect(new URL(`/${profile.role}`, request.url));
      }
    }

    // Role-based protection for frontend routes
    if (path.startsWith('/mahasiswa') || path.startsWith('/dosen') || path.startsWith('/admin') || path.startsWith('/kajur')) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role;

      if (path.startsWith('/mahasiswa') && role !== 'mahasiswa') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/dosen') && role !== 'dosen') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/kajur') && role !== 'kajur' && role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
