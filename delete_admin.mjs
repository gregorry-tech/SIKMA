import { createClient } from '@supabase/supabase-js';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteAdmin() {
  const email = 'admin@admin.com';

  console.log(`Deleting admin account: ${email}...`);

  try {
    // Find user by email
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    console.log('Users response:', data);

    const users = data?.users || [];
    const userToDelete = users.find(u => u.email === email);

    if (!userToDelete) {
      console.log(`Admin account with email ${email} not found.`);
      return;
    }

    console.log(`Found user to delete: ${userToDelete.id}`);

    // Delete from profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userToDelete.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return;
    }

    console.log('Profile deleted successfully.');

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return;
    }

    console.log(`Admin account ${email} deleted successfully.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAdmin();
