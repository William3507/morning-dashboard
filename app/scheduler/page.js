import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NavBar from '../components/NavBar'
import AssignmentModal from './AssignmentModal'
import GenerateButton from './GenerateButton.js'
import ScheduleView from './ScheduleView'
import WeeklyCalendar from './WeeklyCalendar'
import AvailabilityEditor from './AvailabilityEditor'
import { deleteAssignment, generateSchedule } from './actions'

export default async function SchedulerPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // --- DATA FETCHES ---
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  const { data: availabilityBlocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  const { data: workSessions } = await supabase
    .from('work_sessions')
    .select('*, assignments(title)')
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })

  // --- HEADER STATS ---
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySessions = workSessions?.filter(s => s.scheduled_date === todayStr) || []
  const todayUpcoming = todaySessions.filter(s => s.status === 'upcoming').length
  const todayCompleted = todaySessions.filter(s => s.status === 'completed').length
  const firstName = user.user_metadata.full_name?.split(' ')[0]

  // Find the next upcoming session for display
  const nextSession = workSessions?.find(s =>
    s.status === 'upcoming' && s.scheduled_date >= todayStr
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {todaySessions.length === 0
                ? 'Nothing scheduled today.'
                : todayUpcoming === 0
                ? `All ${todayCompleted} sessions completed today.`
                : `${todayUpcoming} session${todayUpcoming !== 1 ? 's' : ''} remaining today.`
              }
              {nextSession && todayUpcoming > 0 && (
                <span className="text-slate-400">
                  {' '}Next up: {nextSession.assignments?.title} at {formatTimeShort(nextSession.start_time)}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GenerateButton userId={user.id} action={generateSchedule} />
            <AssignmentModal userId={user.id} />
          </div>
        </div>

        {/* --- MAIN CONTENT (priority order) --- */}
        <div className="space-y-10">

          {/* 1. Today + Upcoming schedule */}
          <ScheduleView sessions={workSessions || []} />

          {/* 2. Weekly calendar */}
          <WeeklyCalendar sessions={workSessions || []} />

          {/* 3. Assignments */}
          <div>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
              Assignments
            </h2>

            {!assignments?.length ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
                <p className="text-slate-400 text-sm">No assignments yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        assignment.status === 'complete'
                          ? 'bg-green-400'
                          : assignment.status === 'in_progress'
                          ? 'bg-sky-400'
                          : 'bg-slate-300'
                      }`} />
                      <div className="min-w-0">
                        <h3 className={`text-sm font-medium truncate ${
                          assignment.status === 'complete'
                            ? 'text-slate-400 line-through'
                            : 'text-slate-700'
                        }`}>
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Due {formatDateShort(assignment.due_date)}
                          {assignment.assignment_type && ` · ${assignment.assignment_type}`}
                          {` · ${assignment.estimated_hours}h`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        assignment.status === 'complete'
                          ? 'bg-green-50 text-green-600'
                          : assignment.status === 'in_progress'
                          ? 'bg-sky-50 text-sky-600'
                          : 'bg-slate-50 text-slate-500'
                      }`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                      <form action={deleteAssignment}>
                        <input type="hidden" name="id" value={assignment.id} />
                        <button
                          type="submit"
                          className="text-slate-300 hover:text-red-400 transition-colors text-xs"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Availability (collapsed by default) */}
          <AvailabilityEditor userId={user.id} blocks={availabilityBlocks || []} />

        </div>
      </div>
    </div>
  )
}

// --- HELPER FUNCTIONS ---
// These live outside the component since they're pure utilities

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatTimeShort(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}