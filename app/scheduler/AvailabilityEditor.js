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
      className="px-3 py-1.5 bg-sky-400 text-white text-sm rounded hover:bg-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

function formatTime(timeStr) {
  // Converts "14:00:00" or "14:00" to "2:00 PM"
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

export default function AvailabilityEditor({ userId, blocks }) {
  const [activeDay, setActiveDay] = useState(null)

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">
        Weekly Availability
      </h2>

      <div className="space-y-3">
        {DAY_NAMES.map((dayName, dayIndex) => {
          const dayBlocks = blocks.filter((b) => b.day_of_week === dayIndex)

          return (
            <div key={dayIndex} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-slate-700">{dayName}</h3>
                <button
                  onClick={() => setActiveDay(activeDay === dayIndex ? null : dayIndex)}
                  className="text-sm text-sky-500 hover:text-sky-600"
                >
                  {activeDay === dayIndex ? 'Cancel' : '+ Add block'}
                </button>
              </div>

              {/* Existing blocks for this day */}
              {dayBlocks.length > 0 && (
                <div className="mt-2 space-y-1">
                  {dayBlocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {formatTime(block.start_time)} – {formatTime(block.end_time)}
                      </span>
                      <form action={deleteAvailabilityBlock}>
                        <input type="hidden" name="id" value={block.id} />
                        <button
                          type="submit"
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {dayBlocks.length === 0 && activeDay !== dayIndex && (
                <p className="text-sm text-slate-400 mt-1">No availability set</p>
              )}

              {/* Add block form — only visible for the active day */}
              {activeDay === dayIndex && (
                <form action={addAvailabilityBlock} className="mt-3 flex items-end gap-3">
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="dayOfWeek" value={dayIndex} />

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start</label>
                    <input
                      type="time"
                      name="startTime"
                      required
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End</label>
                    <input
                      type="time"
                      name="endTime"
                      required
                      className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700"
                    />
                  </div>

                  <SubmitBlockButton />
                </form>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}