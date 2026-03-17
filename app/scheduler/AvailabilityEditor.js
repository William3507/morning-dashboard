'use client'

import { useState } from 'react'
import { addAvailabilityBlock, deleteAvailabilityBlock } from './actions'
import { useFormStatus } from 'react-dom'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function SubmitBlockButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs px-2.5 py-1 rounded-full border border-sky-200 text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Summarize availability into a short string like "Mon, Wed, Fri · 12 hrs/week"
function buildSummary(blocks) {
  if (blocks.length === 0) return 'No availability set'

  const daySet = new Set(blocks.map(b => b.day_of_week))
  const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  // Sort days starting from Monday: 1,2,3,4,5,6,0
  const sortedDays = [...daySet].sort((a, b) => ((a || 7) - (b || 7)))
  const dayLabels = sortedDays.map(d => dayAbbrevs[d]).join(', ')

  let totalMinutes = 0
  for (const block of blocks) {
    const [sh, sm] = block.start_time.split(':').map(Number)
    const [eh, em] = block.end_time.split(':').map(Number)
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm)
  }
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  return `${dayLabels} · ${totalHours} hrs/week`
}

export default function AvailabilityEditor({ userId, blocks }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDay, setActiveDay] = useState(null)

  const summary = buildSummary(blocks)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Availability
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{summary}</span>
          <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-sm">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {DAY_NAMES.map((dayName, dayIndex) => {
            const dayBlocks = blocks.filter((b) => b.day_of_week === dayIndex)

            return (
              <div key={dayIndex} className="px-4 py-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-slate-700">{dayName}</h3>

                  <div className="flex items-center gap-3">
                    {dayBlocks.length > 0 && (
                      <div className="flex items-center gap-2">
                        {dayBlocks.map((block) => (
                          <div key={block.id} className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-mono">
                              {formatTime(block.start_time)} – {formatTime(block.end_time)}
                            </span>
                            <form action={deleteAvailabilityBlock}>
                              <input type="hidden" name="id" value={block.id} />
                              <button
                                type="submit"
                                className="text-slate-300 hover:text-red-400 transition-colors text-xs"
                              >
                                ✕
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setActiveDay(activeDay === dayIndex ? null : dayIndex)}
                      className="text-xs text-slate-400 hover:text-sky-500 transition-colors"
                    >
                      {activeDay === dayIndex ? 'Cancel' : '+ Add'}
                    </button>
                  </div>
                </div>

                {dayBlocks.length === 0 && activeDay !== dayIndex && (
                  <p className="text-xs text-slate-300 mt-1">No availability</p>
                )}

                {activeDay === dayIndex && (
                  <form action={addAvailabilityBlock} className="mt-3 flex items-end gap-3">
                    <input type="hidden" name="userId" value={userId} />
                    <input type="hidden" name="dayOfWeek" value={dayIndex} />

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Start</label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">End</label>
                      <input
                        type="time"
                        name="endTime"
                        required
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                      />
                    </div>

                    <SubmitBlockButton />
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}