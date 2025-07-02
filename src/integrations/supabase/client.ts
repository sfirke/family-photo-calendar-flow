
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://qceffcmjupykcwktdfti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWZmY21qdXB5a2N3a3RkZnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NDY4NDYsImV4cCI6MjA2NTUyMjg0Nn0.vkE56UbOPUUyJe0Iey5Tlykc9YQs8oR0aQIxmTrSEbI'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
