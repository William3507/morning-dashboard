'use client'

import { updateSessionStatus } from './actions'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES[date.getDay()]
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  return `${dayName}, ${month} ${day}`
}

export default function ScheduleView({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Your Schedule
        </h2>
        <p className="text-slate-500">
          No sessions yet. Add assignments and availability, then hit Generate Schedule.
        </p>
      </div>
    )
  }

  // Group sessions by date
  const grouped = {}
  for (const session of sessions) {
    if (!grouped[session.scheduled_date]) {
      grouped[session.scheduled_date] = []
    }
    grouped[session.scheduled_date].push(session)
  }

  const dates = Object.keys(grouped).sort()

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Your Schedule
      </h2>

      <div className="space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <h3 className="font-medium text-slate-700 mb-2">
              {formatDate(date)}
            </h3>

            <div className="space-y-1">
              {grouped[date].map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-2"
                >
                  <span className="text-sm font-medium text-slate-500 w-36 shrink-0">
                    {formatTime(session.start_time)} – {formatTime(session.end_time)}
                  </span>

                  <span className="text-sm text-slate-700">
                    {session.assignments?.title || 'Unknown assignment'}
                  </span>

                  {session.status === 'upcoming' ? (
                    <div className="flex items-center gap-2 ml-auto">
                        <form action={updateSessionStatus}>
                        <input type="hidden" name="id" value={session.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button
                            type="submit"
                            className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                        >
                            Done
                        </button>
                        </form>
                        <form action={updateSessionStatus}>
                        <input type="hidden" name="id" value={session.id} />
                        <input type="hidden" name="status" value="skipped" />
                        <button
                            type="submit"
                            className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200"
                        >
                            Skip
                        </button>
                        </form>
                    </div>
                    ) : (
  <span className={`text-xs px-2 py-0.5 rounded ml-auto ${
    session.status === 'completed'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-600'
  }`}>
    {session.status}
  </span>
)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}