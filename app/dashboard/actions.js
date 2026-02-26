'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function addTask(formData) {
  const title = formData.get('title')
  const userId = formData.get('userId')
  
  const supabase = await createSupabaseServer()
  await supabase.from('tasks').insert({ title, user_id: userId })
  redirect('/dashboard')
}

export async function toggleTask(formData) {
  const id = formData.get('id')
  const completed = formData.get('completed') === 'true'
  
  const supabase = await createSupabaseServer()
  await supabase
    .from('tasks')
    .update({ 
      completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null
    })
    .eq('id', id)
  
  redirect('/dashboard')
}

export async function deleteTask(formData) {
  const id = formData.get('id')
  
  const supabase = await createSupabaseServer()
  await supabase.from('tasks').delete().eq('id', id)
  redirect('/dashboard')
}