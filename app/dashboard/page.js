import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { theme } from '@/lib/theme'
import { addTask, toggleTask, deleteTask } from './actions'

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

    // Fetch NPR news
    const newsResponse = await fetch('https://feeds.npr.org/1001/rss.xml', { next: { revalidate: 3600 } })
    const newsXml = await newsResponse.text()
    const newsItems = [...newsXml.matchAll(/<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)]
      .slice(0, 5)
      .map(match => ({ title: decodeHtml(match[1]), link: match[2] }))

  const today = new Date().toISOString().split('T')[0]
  const completedToday = tasks?.filter(t => t.completed_at?.startsWith(today)).length || 0
  const goal = 5

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.pageText} p-8`}>
      <h1 className="text-2xl font-bold mb-6">
        Good morning, {user.user_metadata.full_name?.split(' ')[0]}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Card */}
        <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
          <h2 className={`text-lg font-semibold ${theme.cardHeading}`}>Tasks</h2>
          
          <form action={addTask} className="mb-4 flex gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="text"
              name="title"
              placeholder="Add a task..."
              className={`${theme.inputBorder} ${theme.inputBg} rounded px-3 py-2 flex-1 text-sm ${theme.cardText}`}
              required
            />
            <button type="submit" className={`${theme.buttonPrimary} px-3 py-2 rounded text-sm`}>
              Add
            </button>
          </form>

          {tasks?.length === 0 ? (
            <p className={`${theme.cardTextMuted} text-sm`}>No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks?.map(task => (
                <li key={task.id} className="flex items-center gap-2 group">
                  <form action={toggleTask}>
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="completed" value={task.completed} />
                    <button type="submit" className="cursor-pointer">
                      {task.completed ? '☑️' : '⬜'}
                    </button>
                  </form>
                  <span className={`flex-1 text-sm ${task.completed ? `line-through ${theme.cardTextMuted}` : theme.cardText}`}>
                    {task.title}
                  </span>
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={task.id} />
                    <button type="submit" className={`${theme.buttonDanger} opacity-0 group-hover:opacity-100 text-sm`}>
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Calendar Card */}
        <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
          <h2 className={`text-lg font-semibold ${theme.cardHeading} mb-4`}>Calendar</h2>
          <p className={`${theme.cardTextMuted} text-sm`}>Coming soon...</p>
        </div>

        {/* News Card */}
        <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
          <h2 className={`text-lg font-semibold ${theme.cardHeading} mb-4`}>NPR News</h2>
          {newsItems.length === 0 ? (
            <p className={`${theme.cardTextMuted} text-sm`}>Unable to load news.</p>
          ) : (
            <ul className="space-y-3">
              {newsItems.map((item, i) => (
                <li key={i}>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-sm ${theme.cardText} hover:underline`}
                  >
                    {/*Actual Title: (add the "NPR: " idea*/}
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Heatmap Card */}
        <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
          <h2 className={`text-lg font-semibold ${theme.cardHeading} mb-4`}>Last 14 Days</h2>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (13 - i))
              const dateStr = date.toISOString().split('T')[0]
              const count = tasks?.filter(t => t.completed_at?.startsWith(dateStr)).length || 0
              const intensity = count === 0 ? theme.heatmapEmpty
                : count === 1 ? theme.heatmapLow
                : count === 2 ? theme.heatmapMed
                : theme.heatmapHigh
              return (
                <div key={i} className={`aspect-square rounded ${intensity}`} title={`${dateStr}: ${count} tasks`} />
              )
            })}
          </div>
          <div className={`flex justify-between mt-2 text-xs ${theme.cardTextMuted}`}>
            <span>2 weeks ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
          <h2 className={`text-lg font-semibold ${theme.cardHeading} mb-4`}>Today's Progress</h2>
          <div className={`flex justify-between text-sm mb-2 ${theme.cardText}`}>
            <span>{completedToday} of {goal} tasks</span>
            <span>{Math.round(Math.min((completedToday / goal) * 100, 100))}%</span>
          </div>
          <div className={`w-full ${theme.heatmapEmpty} rounded-full h-4`}>
            <div 
              className={`${theme.progressBar} h-4 rounded-full transition-all`}
              style={{ width: `${Math.min((completedToday / goal) * 100, 100)}%` }}
            />
          </div>
          {completedToday >= goal && (
            <p className={`${theme.progressSuccess} text-sm mt-2`}>🎉 Goal reached!</p>
          )}
        </div>
      </div>
    </div>
  )
}