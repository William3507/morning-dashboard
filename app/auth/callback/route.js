import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const response = NextResponse.redirect(new URL('/scheduler', request.url))

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('session data:', data)
    if (error) console.error('session error:', error)
  }

  return response
}
