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

export async function generateSchedule(formData) {
  const supabase = await createSupabaseServer()
  const userId = formData.get('userId')

  // --- CONFIG (easy to change later) ---
  const SESSION_MINUTES = 30
  const MAX_CONSECUTIVE = 4   // 4 × 30 min = 2 hours
  const BREAK_SLOTS = 1       // 1 × 30 min = 30-min break

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

  console.log('Assignments found:', assignments?.length)
  console.log('Availability blocks found:', availabilityBlocks?.length)

  // --- PHASE 1: BUILD SLOT GRID ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const furthestDeadline = new Date(
    Math.max(...assignments.map(a => new Date(a.due_date).getTime()))
  )

  const slots = []

  for (
    let d = new Date(today);
    d <= furthestDeadline;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay()
    const dayBlocks = availabilityBlocks.filter(b => b.day_of_week === dayOfWeek)

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

  console.log('Total slots generated:', slots.length)

  // --- PHASE 2: FILL SLOTS (earliest deadline first) ---
  for (const assignment of assignments) {
    const sessionsNeeded = Math.ceil(assignment.estimated_hours * 2)
    let sessionsPlaced = 0
    let consecutive = 0
    let skipUntilIndex = -1
    // Track last placed slot to detect adjacency
    let lastDate = null
    let lastEnd = null

    for (let i = 0; i < slots.length && sessionsPlaced < sessionsNeeded; i++) {
      const slot = slots[i]

      // Must be before due date
      if (slot.date >= assignment.due_date) continue

      // Already claimed by a higher-priority assignment
      if (slot.assigned_to !== null) {
        consecutive = 0
        continue
      }

      // In the break zone after hitting the 2-hour cap
      if (i <= skipUntilIndex) continue

      // Check if this slot is adjacent to the last one we placed
      const isAdjacent = (slot.date === lastDate && slot.start_time === lastEnd)
      consecutive = isAdjacent ? consecutive + 1 : 1

      // Place the session
      slot.assigned_to = assignment.id
      sessionsPlaced++
      lastDate = slot.date
      lastEnd = slot.end_time

      // If we just hit the cap, enforce a break
      if (consecutive >= MAX_CONSECUTIVE) {
        skipUntilIndex = i + BREAK_SLOTS
        consecutive = 0
      }
    }
  }

  // --- PHASE 3: WRITE TO DATABASE ---
  // Clear old scheduled sessions (keeps completed ones intact)
  await supabase
    .from('work_sessions')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'upcoming')


  // Build rows from filled slots
  const newSessions = slots
    .filter(s => s.assigned_to !== null)
    .map(s => ({
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