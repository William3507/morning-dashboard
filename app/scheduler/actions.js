'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

// --- ASSIGNMENT ACTIONS ---

export async function addAssignment(formData) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.from('assignments').insert({
    user_id: formData.get('userId'),
    title: formData.get('title'),
    assignment_type: formData.get('assignmentType') || null,
    due_date: formData.get('dueDate'),
    estimated_hours: parseFloat(formData.get('estimatedHours')),
    status: 'not_started',
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

// --- AVAILABILITY ACTIONS ---

export async function addAvailabilityBlock(formData) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.from('availability_blocks').insert({
    user_id: formData.get('userId'),
    day_of_week: parseInt(formData.get('dayOfWeek')),
    start_time: formData.get('startTime'),
    end_time: formData.get('endTime'),
  })

  if (error) {
    console.error('Failed to add availability block:', error)
  }

  redirect('/scheduler')
}

export async function deleteAvailabilityBlock(formData) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', formData.get('id'))

  if (error) {
    console.error('Failed to delete availability block:', error)
  }

  redirect('/scheduler')
}

// --- SESSION ACTIONS ---

// Updates a single session — kept for backward compatibility
export async function updateSessionStatus(formData) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from('work_sessions')
    .update({ status: formData.get('status') })
    .eq('id', formData.get('id'))

  if (error) {
    console.error('Failed to update session:', error)
  }

  redirect('/scheduler')
}

// Updates all sessions in a consolidated block at once.
// Receives a comma-separated string of session IDs.
export async function updateBlockStatus(formData) {
  const supabase = await createSupabaseServer()
  const ids = formData.get('ids').split(',')
  const status = formData.get('status')

  // Update the sessions
  const { data: updatedSessions, error } = await supabase
    .from('work_sessions')
    .update({ status })
    .in('id', ids)
    .select('assignment_id')

  if (error) {
    console.error('Failed to update block:', error)
    redirect('/scheduler')
    return
  }

  // Update assignment status based on session progress
  const assignmentId = updatedSessions?.[0]?.assignment_id
  if (assignmentId) {
    const { data: allSessions } = await supabase
      .from('work_sessions')
      .select('status')
      .eq('assignment_id', assignmentId)

    if (allSessions) {
      const total = allSessions.length
      const completed = allSessions.filter(s => s.status === 'completed').length

      let assignmentStatus = 'not_started'
      if (completed >= total) {
        assignmentStatus = 'complete'
      } else if (completed > 0) {
        assignmentStatus = 'in_progress'
      }

      await supabase
        .from('assignments')
        .update({ status: assignmentStatus })
        .eq('id', assignmentId)
    }
  }

  redirect('/scheduler')
}

// --- SCHEDULE GENERATION ---
// Config constants — change these to adjust scheduling behavior
const SESSION_MINUTES = 30
const MAX_CONSECUTIVE = 2 // 2 × 30 min = 1 hour before switching assignments

export async function generateSchedule(formData) {
  const supabase = await createSupabaseServer()
  const userId = formData.get('userId')

  // --- FETCH INPUTS ---
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'complete')
    .order('due_date', { ascending: true })

  const { data: availabilityBlocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', userId)

  if (!assignments?.length || !availabilityBlocks?.length) {
    redirect('/scheduler')
    return
  }

  // --- ACCOUNT FOR ALREADY-COMPLETED SESSIONS ---
  const { data: completedSessions } = await supabase
    .from('work_sessions')
    .select('assignment_id')
    .eq('user_id', userId)
    .eq('status', 'completed')

  const completedCounts = {}
  for (const session of completedSessions || []) {
    completedCounts[session.assignment_id] = (completedCounts[session.assignment_id] || 0) + 1
  }

  const assignmentQueue = assignments
    .map((a) => ({
      ...a,
      sessions_remaining: Math.max(
        0,
        Math.ceil(a.estimated_hours * 2) - (completedCounts[a.id] || 0)
      ),
    }))
    .filter((a) => a.sessions_remaining > 0)

  if (assignmentQueue.length === 0) {
    redirect('/scheduler')
    return
  }

  // --- PHASE 1: BUILD SLOT GRID ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const furthestDeadline = new Date(
    Math.max(...assignmentQueue.map((a) => new Date(a.due_date).getTime()))
  )

  const slots = []

  for (
    let d = new Date(today);
    d <= furthestDeadline;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay()
    const dayBlocks = availabilityBlocks.filter((b) => b.day_of_week === dayOfWeek)

    for (const block of dayBlocks) {
      const [startH, startM] = block.start_time.split(':').map(Number)
      const [endH, endM] = block.end_time.split(':').map(Number)
      const blockStart = startH * 60 + startM
      const blockEnd = endH * 60 + endM

      for (let t = blockStart; t + SESSION_MINUTES <= blockEnd; t += SESSION_MINUTES) {
        const sh = String(Math.floor(t / 60)).padStart(2, '0')
        const sm = String(t % 60).padStart(2, '0')
        const eT = t + SESSION_MINUTES
        const eh = String(Math.floor(eT / 60)).padStart(2, '0')
        const em = String(eT % 60).padStart(2, '0')

        slots.push({
          date: dateStr,
          start_time: `${sh}:${sm}`,
          end_time: `${eh}:${em}`,
          assigned_to: null,
        })
      }
    }
  }

  // --- PHASE 2: ROUND-ROBIN FILL ---
  let currentIdx = 0
  let consecutive = 0

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const queueLen = assignmentQueue.length

    for (let attempt = 0; attempt < queueLen; attempt++) {
      const candidate = assignmentQueue[(currentIdx + attempt) % queueLen]

      if (candidate.sessions_remaining <= 0) continue
      if (slot.date >= candidate.due_date) continue

      const actualIdx = (currentIdx + attempt) % queueLen
      if (attempt > 0) {
        currentIdx = actualIdx
        consecutive = 0
      }

      slot.assigned_to = candidate.id
      candidate.sessions_remaining--
      consecutive++

      if (consecutive >= MAX_CONSECUTIVE) {
        currentIdx = (currentIdx + 1) % queueLen
        consecutive = 0
      }

      break
    }
  }

  // --- PHASE 3: WRITE TO DATABASE ---
  await supabase
    .from('work_sessions')
    .delete()
    .eq('user_id', userId)
    .in('status', ['upcoming', 'completed', 'skipped'])

  const newSessions = slots
    .filter((s) => s.assigned_to !== null)
    .map((s) => ({
      user_id: userId,
      assignment_id: s.assigned_to,
      scheduled_date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      status: 'upcoming',
    }))

  if (newSessions.length > 0) {
    const { error } = await supabase.from('work_sessions').insert(newSessions)
    if (error) console.error('Failed to create sessions:', error)
  }

  redirect('/scheduler')
}