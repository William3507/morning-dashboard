'use client'

import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div>
      <h1>Morning Dashboard</h1>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  )
}