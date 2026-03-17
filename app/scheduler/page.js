import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AssignmentModal from './AssignmentModal'
import AvailabilityEditor from './AvailabilityEditor'
import { deleteAssignment, generateSchedule } from './actions'
import ScheduleView from './ScheduleView'


export default async function SchedulerPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Fetch assignments, sorted by due date (nearest first)
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  // Fetch availability blocks
  const { data: availabilityBlocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  // Fetch work sessions
  const { data: workSessions } = await supabase
    .from('work_sessions')
    .select('*, assignments(title)')
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="flex justify-between items-center mb-6">
        
        <div>
          <h1 className="text-2xl font-bold text-slate-700">
            Scheduler
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome, {user.user_metadata.full_name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form action={generateSchedule}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              Generate Schedule
            </button>
          </form>
          <AssignmentModal userId={user.id} />
        </div>
      </div>

      {/* Assignments list */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Your Assignments
        </h2>
        
        {assignments?.length === 0 ? (
          <p className="text-slate-500">No assignments yet. Add one to get started!</p>
        ) : (
          <div className="space-y-3">
            {assignments?.map((assignment) => (
            <div 
                key={assignment.id}
                className="border border-slate-200 rounded-lg p-4 flex justify-between items-center"
                >
                <div>
                    <h3 className="font-medium text-slate-700">{assignment.title}</h3>
                    <p className="text-sm text-slate-500">
                    Due: {new Date(assignment.due_date).toLocaleDateString()} 
                    {assignment.assignment_type && ` • ${assignment.assignment_type}`}
                    {` • ${assignment.estimated_hours}h estimated`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm px-2 py-1 rounded ${
                    assignment.status === 'complete' 
                        ? 'bg-green-100 text-green-700'
                        : assignment.status === 'in_progress'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                    {assignment.status.replace('_', ' ')}
                    </span>
                    <form action={deleteAssignment}>
                    <input type="hidden" name="id" value={assignment.id} />
                    <button 
                        type="submit"
                        className="text-red-500 hover:text-red-700 text-sm"
                    >
                        Delete
                    </button>
                    </form>
                </div>
                </div>
            ))}
          </div>
        )}
      </div>

        <AvailabilityEditor userId={user.id} blocks={availabilityBlocks || []} />
        <ScheduleView sessions={workSessions || []} />

    </div>
  )
}