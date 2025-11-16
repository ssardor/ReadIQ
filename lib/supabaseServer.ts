import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Supabase Server Client Config:')
console.log('  URL:', supabaseUrl)
console.log('  Service Key exists:', !!supabaseServiceRoleKey)
console.log('  Service Key length:', supabaseServiceRoleKey?.length)
console.log('  Service Key starts with:', supabaseServiceRoleKey?.substring(0, 20))

// This client should only be used on the server-side
// It has elevated privileges and can bypass RLS policies
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': supabaseServiceRoleKey
    }
  }
})
