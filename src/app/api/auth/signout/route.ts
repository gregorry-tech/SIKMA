import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function performSignout(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-') && (cookie.name.endsWith('-auth-token') || cookie.name.endsWith('-auth-token-code-verifier'))) {
      cookieStore.delete(cookie.name);
    }
  });
}

export async function POST(request: Request) {
  await performSignout(request);
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET(request: Request) {
  await performSignout(request);
  return NextResponse.redirect(new URL('/login?logged_out=1', request.url));
}
