'use client'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const COLORS = [
  'bg-sky-400', 'bg-amber-400', 'bg-violet-400',
  'bg-emerald-400', 'bg-rose-400', 'bg-orange-400',
]

const COLORS_FADED = [
  'bg-sky-200', 'bg-amber-200', 'bg-violet-200',
  'bg-emerald-200', 'bg-rose-200', 'bg-orange-200',
]

function formatHour(hour) {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0]
}

// Get the 7 dates (Mon–Sun) for the week containing today
function getCurrentWeekDates() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()

  // getDay() returns 0 for Sunday. We want Monday = 0, so shift:
  // Monday=0, Tuesday=1, ... Saturday=5, Sunday=6
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function WeeklyCalendar({ sessions }) {
  if (!sessions || sessions.length === 0) return null

  const weekDates = getCurrentWeekDates()

  // Filter sessions to only this week
  const weekSessions = sessions.filter(s => weekDates.includes(s.scheduled_date))
  if (weekSessions.length === 0) return null

  // Build color map from ALL sessions (so colors stay consistent with the list above)
  const colorMap = {}
  const colorFadedMap = {}
  let colorIndex = 0
  for (const s of sessions) {
    if (!colorMap[s.assignment_id]) {
      colorMap[s.assignment_id] = COLORS[colorIndex % COLORS.length]
      colorFadedMap[s.assignment_id] = COLORS_FADED[colorIndex % COLORS_FADED.length]
      colorIndex++
    }
  }

  // Find the time range from this week's sessions only
  const allStartHours = weekSessions.map(s => parseInt(s.start_time.split(':')[0]))
  const allEndHours = weekSessions.map(s => {
    const [h, m] = s.end_time.split(':').map(Number)
    return m > 0 ? h + 1 : h
  })
  const minHour = Math.min(...allStartHours)
  const maxHour = Math.max(...allEndHours)

  // Map sessions to grid positions
  const grid = {}
  for (const s of weekSessions) {
    const [h, m] = s.start_time.split(':').map(Number)
    const slotIndex = (h - minHour) * 2 + (m >= 30 ? 1 : 0)
    const key = `${s.scheduled_date}-${slotIndex}`
    grid[key] = {
      color: s.status !== 'upcoming'
        ? colorFadedMap[s.assignment_id]
        : colorMap[s.assignment_id],
      title: s.assignments?.title || '?',
      status: s.status,
    }
  }

  const totalSlots = (maxHour - minHour) * 2

  return (
    <div className="mt-10">
      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
        This Week
      </h2>

      <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `48px repeat(7, 1fr)`,
            gridTemplateRows: `36px repeat(${totalSlots}, 24px)`,
          }}
        >
          {/* Header: empty corner + 7 day columns (Mon–Sun) */}
          <div />
          {weekDates.map(date => {
            const d = new Date(date + 'T00:00:00')
            const today = isToday(date)
            // DAY_NAMES is Mon-indexed, so Monday=0 ... Sunday=6
            // getDay() gives Sun=0, Mon=1 ... Sat=6
            // Convert: (getDay() + 6) % 7 gives Mon=0 ... Sun=6
            const dayLabel = DAY_NAMES[(d.getDay() + 6) % 7]
            return (
              <div key={date} className="flex flex-col items-center justify-center">
                <span className="text-xs text-slate-400">{dayLabel}</span>
                <span className={`text-sm font-medium leading-none ${
                  today
                    ? 'bg-sky-400 text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : 'text-slate-600'
                }`}>
                  {d.getDate()}
                </span>
              </div>
            )
          })}

          {/* Time grid */}
          {Array.from({ length: totalSlots }, (_, slotIdx) => {
            const hour = minHour + Math.floor(slotIdx / 2)
            const isHalfHour = slotIdx % 2 === 1
            const isHourBoundary = slotIdx % 2 === 0

            return [
              <div
                key={`time-${slotIdx}`}
                className="flex items-start justify-end pr-2 -mt-1.5"
              >
                {!isHalfHour && (
                  <span className="text-[10px] text-slate-300">{formatHour(hour)}</span>
                )}
              </div>,

              ...weekDates.map(date => {
                const key = `${date}-${slotIdx}`
                const cell = grid[key]

                // Check neighbors for rounded corners
                const above = grid[`${date}-${slotIdx - 1}`]
                const below = grid[`${date}-${slotIdx + 1}`]
                const sameAbove = above && above.title === cell?.title
                const sameBelow = below && below.title === cell?.title

                let rounding = ''
                if (cell) {
                  if (!sameAbove && !sameBelow) rounding = 'rounded'
                  else if (!sameAbove) rounding = 'rounded-t'
                  else if (!sameBelow) rounding = 'rounded-b'
                }

                return (
                  <div
                    key={key}
                    className={`mx-0.5 ${
                      cell
                        ? `${cell.color} ${rounding}`
                        : isHourBoundary
                        ? 'border-t border-slate-100'
                        : ''
                    }`}
                    title={cell ? `${cell.title} (${cell.status})` : ''}
                  />
                )
              }),
            ]
          })}
        </div>
      </div>
    </div>
  )
}