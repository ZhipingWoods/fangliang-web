import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Provide fallback for build time when env vars are not set
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    console.warn('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    // Return a mock client or throw error
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder'
    )
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  )
}