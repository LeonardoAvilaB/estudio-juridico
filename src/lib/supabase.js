import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://xocuoskxphyibjjcrvur.supabase.co'      // reemplaza esto
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvY3Vvc2t4cGh5aWJqamNydnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzgzMzUsImV4cCI6MjA5NDQ1NDMzNX0.p_L3mLlRsvTP1BJq0is0z5XKKda-0gBSDpX7SqKOjxQ'     // reemplaza esto

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})