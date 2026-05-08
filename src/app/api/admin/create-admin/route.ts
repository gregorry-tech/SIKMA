import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const secret = process.env.ADMIN_CREATE_SECRET;
    const header = request.headers.get('x-admin-secret');
    if (!secret || header !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, full_name } = body;
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'admin' }
    });

    if (error) throw error;

    // update profile role
    await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', data.user?.id);

    return NextResponse.json({ data: { message: 'Admin created', user: data.user } }, { status: 201 });
  } catch (err: any) {
    console.error('Create admin error', err);
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
