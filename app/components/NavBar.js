import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="text-lg font-semibold text-slate-800">
          Tempo
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/scheduler"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Scheduler
          </Link>
        </div>
      </div>
    </nav>
  )
}

