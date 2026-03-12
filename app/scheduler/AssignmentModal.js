'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addAssignment } from './actions'
import { deleteAssignment } from './actions'


//Deal with double submit by disabling button while pending post.
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed"
    >
      {pending ? 'Adding...' : 'Add Assignment'}
    </button>
  )
}

export default function AssignmentModal({ userId }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-sky-400 text-white px-4 py-2 rounded-lg hover:bg-sky-500"
      >
        + Add Assignment
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-700 mb-4">
              New Assignment
            </h2>
            
            <form action={addAssignment} className="space-y-4">
              {/* Hidden field to pass userId */}
              <input type="hidden" name="userId" value={userId} />
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Math Problem Set 5"
                />
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type (optional)
                </label>
                <select
                  name="assignmentType"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">Select type...</option>
                  <option value="essay">Essay</option>
                  <option value="test">Test/Exam</option>
                  <option value="homework">Homework</option>
                  <option value="project">Project</option>
                  <option value="reading">Reading</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  required
                  min="0.5"
                  step="0.5"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="2"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <SubmitButton />

              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}