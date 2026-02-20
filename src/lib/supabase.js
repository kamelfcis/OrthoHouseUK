import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZmttdHV4cWF6bm5tbXhleWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTU0OTcsImV4cCI6MjA3NzkzMTQ5N30.MU7OiIZ1FKbLdec3g56VZj6UqLjctUW4s5C1FrPVWUk'

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

