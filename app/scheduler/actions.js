'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function addAssignment(formData) {
  const supabase = await createSupabaseServer()
  
  const { error } = await supabase.from('assignments').insert({
    user_id: formData.get('userId'),
    title: formData.get('title'),
    assignment_type: formData.get('assignmentType') || null,
    due_date: formData.get('dueDate'),
    estimated_hours: parseFloat(formData.get('estimatedHours')),
    status: 'not_started'
  })

  if (error) {
    console.error('Failed to add assignment:', error)
  }

  redirect('/scheduler')
}

export async function deleteAssignment(formData) {
  const supabase = await createSupabaseServer()
  
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', formData.get('id'))

  if (error) {
    console.error('Failed to delete assignment:', error)
  }

  redirect('/scheduler')
}