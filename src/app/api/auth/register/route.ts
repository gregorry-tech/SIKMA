import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_PUBLIC_ROLES = ['mahasiswa', 'dosen'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, nim, nidn, semester, program_studi } = body;

    // Basic validation
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!ALLOWED_PUBLIC_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Cannot self-register for this role' }, { status: 403 });
    }

    const supabaseAdmin = createAdminClient();

    // normalize
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check for existing email in profiles
    const { data: existingByEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', normalizedEmail).maybeSingle();
    if (existingByEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Role specific validations
    const updatePayload: any = { role, program_studi: program_studi || null };

    if (role === 'mahasiswa') {
      if (!nim) return NextResponse.json({ error: 'NIM is required for mahasiswa' }, { status: 400 });
      const nimStr = String(nim).trim();
      if (!/^[0-9A-Za-z-]+$/.test(nimStr)) {
        return NextResponse.json({ error: 'Invalid NIM format' }, { status: 400 });
      }
      const { data: existingNim } = await supabaseAdmin.from('profiles').select('id').eq('nim', nimStr).maybeSingle();
      if (existingNim) return NextResponse.json({ error: 'NIM already registered' }, { status: 409 });

      const semNum = semester ? parseInt(String(semester)) : null;
      if (semester && semNum && (isNaN(semNum) || semNum < 1 || semNum > 14)) {
        return NextResponse.json({ error: 'Invalid semester' }, { status: 400 });
      }

      updatePayload.nim = nimStr;
      updatePayload.semester = semNum;
    } else if (role === 'dosen') {
      if (!nidn) return NextResponse.json({ error: 'NIDN is required for dosen' }, { status: 400 });
      const nidnStr = String(nidn).trim();
      const { data: existingNidn } = await supabaseAdmin.from('profiles').select('id').eq('nidn', nidnStr).maybeSingle();
      if (existingNidn) return NextResponse.json({ error: 'NIDN already registered' }, { status: 409 });

      updatePayload.nidn = nidnStr;
    }

    // Create user via Admin API (auto-confirm)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (error) {
      console.error('Supabase createUser error', error);
      return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }

    if (!data.user || !data.user.id) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Upsert profile data (in case the DB trigger did not create one)
    const profileRecord: any = {
      id: data.user.id,
      email: normalizedEmail,
      full_name,
      ...updatePayload,
    };

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(profileRecord);

    if (profileError) {
      console.error('Failed to upsert profile after registration:', profileError);
      // We won't roll back user creation here, but surface a warning
      return NextResponse.json({ data: { message: 'User created but failed to save profile' }, warning: profileError.message }, { status: 201 });
    }

    return NextResponse.json({ data: { message: 'User registered successfully', user: data.user } }, { status: 201 });
  } catch (error: any) {
    console.error('Register API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
