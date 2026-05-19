import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase credentials not configured' }) };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { fullname, email, password, role } = JSON.parse(event.body || '{}');

  if (!fullname || !email || !password || !role) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  try {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullname },
    });

    if (authError) throw authError;

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authUser.user.id,
        email,
        fullname,
        role,
      });

    if (dbError) throw dbError;

    return { statusCode: 201, body: JSON.stringify({ success: true, uid: authUser.user.id }) };
  } catch (error: any) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }
};
