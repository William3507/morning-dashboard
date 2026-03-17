'use client'

import { updateBlockStatus } from './actions'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const ASSIGNMENT_COLORS = [
  { border: 'border-l-sky-400', dot: 'bg-sky-400' },
  { border: 'border-l-amber-400', dot: 'bg-amber-400' },
  { border: 'border-l-violet-400', dot: 'bg-violet-400' },
  { border: 'border-l-emerald-400', dot: 'bg-emerald-400' },
  { border: 'border-l-rose-400', dot: 'bg-rose-400' },
  { border: 'border-l-orange-400', dot: 'bg-orange-400' },
]

function buildColorMap(sessions) {
  const map = {}
  let index = 0
  for (const session of sessions) {
    if (!map[session.assignment_id]) {
      map[session.assignment_id] = ASSIGNMENT_COLORS[index % ASSIGNMENT_COLORS.length]
      index++
    }
  }
  return map
}

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

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

// Merge consecutive sessions for the same assignment into one display block
function consolidateSessions(sessions) {
  if (sessions.length === 0) return []

  const groups = []
  let current = {
    assignment_id: sessions[0].assignment_id,
    title: sessions[0].assignments?.title || 'Unknown',
    start_time: sessions[0].start_time,
    end_time: sessions[0].end_time,
    status: sessions[0].status,
    sessionIds: [sessions[0].id],
  }

  for (let i = 1; i < sessions.length; i++) {
    const session = sessions[i]
    const sameAssignment = session.assignment_id === current.assignment_id
    const isAdjacent = session.start_time === current.end_time
    const sameStatus = session.status === current.status

    if (sameAssignment && isAdjacent && sameStatus) {
      current.end_time = session.end_time
      current.sessionIds.push(session.id)
    } else {
      groups.push(current)
      current = {
        assignment_id: session.assignment_id,
        title: session.assignments?.title || 'Unknown',
        start_time: session.start_time,
        end_time: session.end_time,
        status: session.status,
        sessionIds: [session.id],
      }
    }
  }
  groups.push(current)

  return groups
}

// Renders a single consolidated block row
function BlockRow({ block, colorMap }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-l-4 ${
        colorMap[block.assignment_id]?.border || 'border-l-transparent'
      } ${block.status !== 'upcoming' ? 'opacity-50' : ''}`}
    >
      <span className="text-xs text-slate-400 font-mono w-36 shrink-0">
        {formatTime(block.start_time)} – {formatTime(block.end_time)}
      </span>

      <span className="text-sm text-slate-700 flex-1">
        {block.title}
      </span>

      {block.status === 'upcoming' ? (
        <div className="flex items-center gap-1.5">
          <form action={updateBlockStatus}>
            <input type="hidden" name="ids" value={block.sessionIds.join(',')} />
            <input type="hidden" name="status" value="completed" />
            <button
              type="submit"
              className="text-xs px-2.5 py-1 rounded-full border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
            >
              Done
            </button>
          </form>
          <form action={updateBlockStatus}>
            <input type="hidden" name="ids" value={block.sessionIds.join(',')} />
            <input type="hidden" name="status" value="skipped" />
            <button
              type="submit"
              className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Skip
            </button>
          </form>
        </div>
      ) : (
        <span className={`text-xs px-2.5 py-1 rounded-full ${
          block.status === 'completed'
            ? 'bg-green-50 text-green-600'
            : 'bg-slate-50 text-slate-400'
        }`}>
          {block.status}
        </span>
      )}
    </div>
  )
}

// Dedicated Today section — prominent card with highlight
function TodaySection({ sessions, colorMap }) {
  const todayStr = getTodayStr()
  const todaySessions = sessions.filter(s => s.scheduled_date === todayStr)

  if (todaySessions.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
          Today
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <p className="text-slate-400 text-sm">Nothing scheduled for today.</p>
        </div>
      </div>
    )
  }

  const consolidated = consolidateSessions(todaySessions)
  const upcomingCount = consolidated.filter(b => b.status === 'upcoming').length
  const completedCount = consolidated.filter(b => b.status === 'completed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-sky-500 uppercase tracking-wide">
          ● Today
        </h2>
        <span className="text-xs text-slate-400">
          {completedCount} done · {upcomingCount} remaining
        </span>
      </div>

      <div className="bg-white border border-sky-200 rounded-lg divide-y divide-slate-100">
        {consolidated.map((block, idx) => (
          <BlockRow key={idx} block={block} colorMap={colorMap} />
        ))}
      </div>
    </div>
  )
}

// Upcoming days section (everything after today)
function UpcomingSection({ sessions, colorMap }) {
  const todayStr = getTodayStr()
  const futureSessions = sessions.filter(s =>
  s.scheduled_date > todayStr && s.status === 'upcoming'
)

  if (futureSessions.length === 0) return null

  const grouped = {}
  for (const session of futureSessions) {
    if (!grouped[session.scheduled_date]) {
      grouped[session.scheduled_date] = []
    }
    grouped[session.scheduled_date].push(session)
  }

  const dates = Object.keys(grouped).sort()

  return (
    <div>
      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
        Upcoming
      </h2>

      <div className="space-y-5">
        {dates.map((date) => {
          const consolidated = consolidateSessions(grouped[date])

          return (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-500 mb-2">
                {formatDate(date)}
              </h3>
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {consolidated.map((block, idx) => (
                  <BlockRow key={idx} block={block} colorMap={colorMap} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ScheduleView({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
          Today
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-400 text-sm">
            No sessions yet. Add assignments and availability, then generate a schedule.
          </p>
        </div>
      </div>
    )
  }

  const colorMap = buildColorMap(sessions)

  return (
    <div className="space-y-8">
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(colorMap).map(([assignmentId, color]) => {
          const session = sessions.find(s => s.assignment_id === assignmentId)
          return (
            <div key={assignmentId} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color.dot}`} />
              <span className="text-xs text-slate-500">
                {session?.assignments?.title || 'Unknown'}
              </span>
            </div>
          )
        })}
      </div>

      <TodaySection sessions={sessions} colorMap={colorMap} />
      <UpcomingSection sessions={sessions} colorMap={colorMap} />
    </div>
  )
}