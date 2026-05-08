import { createClient } from '@supabase/supabase-js';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin123';
  const full_name = 'Administrator';

  console.log(`Creating admin: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'admin' }
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('Email already exists')) {
      console.log('Admin already exists.');
    } else {
      console.error('Error creating auth user:', error);
      return;
    }
  } else {
    console.log('Auth user created successfully.');
  }

  let userId = data?.user?.id;

  if (error && (error.message.includes('already registered') || error.message.includes('Email already exists'))) {
    console.log('Admin already exists in auth, fetching user ID to update role...');
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existingUser = usersData.users.find(u => u.email === email);
    if (existingUser) {
      userId = existingUser.id;
    }
  }

  // Ensure profile is admin and exists
  if (userId) {
    // Try to update first
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin', full_name })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('Profile ensured as admin successfully.');
    }
  } else {
    console.error('Could not find user ID to update profile.');
  }
}

createAdmin();
