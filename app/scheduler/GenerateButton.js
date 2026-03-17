'use client'

import { useFormStatus } from 'react-dom'

function Button() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Generating...' : 'Generate Schedule'}
    </button>
  )
}

export default function GenerateButton({ userId, action }) {
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <Button />
    </form>
  )
}