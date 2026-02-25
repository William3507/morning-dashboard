import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )

    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('user:', user)
    console.log('error:', error)
    console.log('cookies:', cookieStore.getAll())
    if (!user) redirect('/login')
  
    return (
        <div>
          <h1>Dashboard</h1>
          <pre>{JSON.stringify(tasks, null, 2)}</pre>
        </div>
    )
}