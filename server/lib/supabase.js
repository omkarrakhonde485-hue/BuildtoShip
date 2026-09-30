const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Service-role client for backend operations (bypasses RLS)
const supabase = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verify user token from frontend or resolve demo role profile
async function getUserFromToken(authHeader, demoRoleHeader) {
  // 1. Try real JWT token from Supabase Auth
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return profile ? { ...user, ...profile } : { ...user, role: 'employee', department: 'General' };
      }
    } catch (e) {
      console.warn('JWT verification attempt failed:', e.message);
    }
  }

  // 2. Fallback: Demo role lookup from profiles table
  const targetRole = (demoRoleHeader || 'admin').toLowerCase();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (profiles && profiles.length > 0) {
    const match = profiles.find(p => p.role.toLowerCase() === targetRole) || profiles[0];
    return match;
  }

  // Fallback default
  return {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Elena Rostova',
    email: 'admin@nexus.ai',
    role: 'admin',
    department: 'Executive Operations'
  };
}

module.exports = { supabase, getUserFromToken };
