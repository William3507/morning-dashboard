import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const theme = {
  // Page
  pageBg: 'bg-black',
  pageText: 'text-white',
  
  // Cards
  cardBg: 'bg-white',
  cardHeading: 'text-gray-400',
  cardTextMuted: 'text-gray-400',
  cardText: 'text-gray-800',
  
  // Buttons
  buttonPrimary: 'bg-blue-500 text-white',
  buttonDanger: 'text-red-400 hover:text-red-600',
  
  // Progress/Heatmap
  progressBar: 'bg-green-500',
  progressSuccess: 'text-green-600',
  heatmapEmpty: 'bg-gray-100',
  heatmapLow: 'bg-red-200',
  heatmapMed: 'bg-green-400',
  heatmapHigh: 'bg-green-600',
  
  // Inputs
  inputBorder: 'border',
  inputBg: 'bg-white',
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function addTask(formData) {
    'use server'
    const title = formData.get('title')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )
    await supabase.from('tasks').insert({ title, user_id: user.id })
    redirect('/dashboard')
  }

  async function toggleTask(formData) {
    'use server'
    const id = formData.get('id')
    const completed = formData.get('completed') === 'true'
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )
    
    const newCompleted = !completed
    await supabase
      .from('tasks')
      .update({ 
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', id)
    
    redirect('/dashboard')
  }

  async function deleteTask(formData) {
    'use server'
    const id = formData.get('id')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )
    await supabase.from('tasks').delete().eq('id', id)
    redirect('/dashboard')
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

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
          <h2 className={`text-lg font-semibold ${theme.cardHeading} mb-4`}>News</h2>
          <p className={`${theme.cardTextMuted} text-sm`}>Coming soon...</p>
        </div>

        {/* Heatmap Card */}
        <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
          <h2 className={`text-lg font-semibold ${theme.cardHeading} mb-4`}>Last 14 Days</h2>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (13 - i))
              const dateStr = date.toISOString().split('T')[0]
              
              const count = tasks?.filter(task => 
                task.completed_at?.startsWith(dateStr)
              ).length || 0
              
              const intensity = count === 0 ? theme.heatmapEmpty
                : count === 1 ? theme.heatmapLow
                : count === 2 ? theme.heatmapMed
                : theme.heatmapHigh
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded ${intensity}`}
                  title={`${dateStr}: ${count} tasks`}
                />
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
          {(() => {
            const today = new Date().toISOString().split('T')[0]
            const completedToday = tasks?.filter(task => 
              task.completed_at?.startsWith(today)
            ).length || 0
            const goal = 5
            const percentage = Math.min((completedToday / goal) * 100, 100)
            
            return (
              <div>
                <div className={`flex justify-between text-sm mb-2 ${theme.cardText}`}>
                  <span>{completedToday} of {goal} tasks</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className={`w-full ${theme.heatmapEmpty} rounded-full h-4`}>
                  <div 
                    className={`${theme.progressBar} h-4 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {completedToday >= goal && (
                  <p className={`${theme.progressSuccess} text-sm mt-2`}>🎉 Goal reached!</p>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}