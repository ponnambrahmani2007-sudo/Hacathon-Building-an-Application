import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Filter,
  KeyRound,
  Loader2,
  LogOut,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import Badge from './components/Badge'
import EmptyState from './components/EmptyState'
import StatCard from './components/StatCard'
import TaskCard from './components/TaskCard'
import { apiRequest, getAuthToken, setAuthToken } from './services/api'
import { aiStatusClass, statusClass, taskStats } from './utils/tasks'
import { formatDate } from './utils/date'

const emptyWorkspace = {
  employees: [],
  tasks: [],
  workLogs: [],
  attachments: [],
  auditLogs: [],
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const phoneRegex = /^\+[1-9]\d{7,14}$/

function hoursFor(logs, employeeId, days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  return logs
    .filter((log) => log.employeeId === employeeId && new Date(log.submittedAt) >= since)
    .reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0)
}

function todayHours(logs, employeeId) {
  const today = new Date().toDateString()
  return logs
    .filter((log) => log.employeeId === employeeId && new Date(log.submittedAt).toDateString() === today)
    .reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [workspace, setWorkspace] = useState(emptyWorkspace)
  const [loading, setLoading] = useState(Boolean(getAuthToken()))
  const [error, setError] = useState('')

  async function loadWorkspace() {
    const data = await apiRequest('/bootstrap')
    setWorkspace(data)
  }

  useEffect(() => {
    async function restoreSession() {
      if (!getAuthToken()) return
      try {
        const payload = await apiRequest('/me')
        setUser(payload.user)
        await loadWorkspace()
      } catch (err) {
        setAuthToken('')
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function handleLogin(credentials) {
    setError('')
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setAuthToken(payload.token)
    setUser(payload.user)
    await loadWorkspace()
  }

  function handleLogout() {
    setAuthToken('')
    setUser(null)
    setWorkspace(emptyWorkspace)
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-700">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
          Loading WorkFlow
        </div>
      </main>
    )
  }

  if (!user) return <AuthScreen onLogin={handleLogin} sessionError={error} />

  return <Workspace user={user} workspace={workspace} setWorkspace={setWorkspace} onRefresh={loadWorkspace} onLogout={handleLogout} />
}

function AuthScreen({ onLogin, sessionError }) {
  const [form, setForm] = useState({ username: 'akash', password: 'akash' })
  const [reset, setReset] = useState({ username: '', otp: '', newPassword: '' })
  const [resetMode, setResetMode] = useState(false)
  const [message, setMessage] = useState(sessionError || '')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await onLogin(form)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function sendOtp() {
    setLoading(true)
    setMessage('')
    try {
      const result = await apiRequest('/password/send-otp', {
        method: 'POST',
        body: JSON.stringify({ username: reset.username }),
      })
      setMessage(result.message)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const result = await apiRequest('/password/reset', {
        method: 'POST',
        body: JSON.stringify(reset),
      })
      setMessage(result.message)
      setResetMode(false)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 lg:grid lg:grid-cols-[1fr_520px]">
      <section className="flex min-h-[44vh] flex-col justify-between bg-slate-950 p-7 text-white lg:min-h-screen lg:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">WorkFlow</span>
        </div>
        <div className="max-w-3xl py-12">
          <Badge className="mb-5 bg-white/10 text-teal-100 ring-white/15">PostgreSQL production build</Badge>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">AI task accountability for managers and delivery teams.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Assign work, track employee hours, verify daily logs with Gemini, and keep an audit trail backed by PostgreSQL.
          </p>
        </div>
        <div className="grid gap-3 text-sm font-semibold text-slate-100 sm:grid-cols-3">
          {['Task ownership', 'Working hours', 'AI assistant'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form onSubmit={submit} className="card p-6">
            <div className="mb-6">
              <p className="text-2xl font-bold text-slate-950">Sign in</p>
              <p className="mt-1 text-sm text-slate-500">Managers are seeded in PostgreSQL: akash / akash and shiva / shiva.</p>
            </div>
            {message ? <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p> : null}
            <div className="space-y-4">
              <label className="block">
                <span className="label">Username or email</span>
                <input className="input mt-1" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </label>
              <label className="block">
                <span className="label">Password</span>
                <input className="input mt-1" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Login
            </button>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" className="btn-secondary" onClick={() => setForm({ username: 'akash', password: 'akash' })}>
                Akash
              </button>
              <button type="button" className="btn-secondary" onClick={() => setForm({ username: 'shiva', password: 'shiva' })}>
                Shiva
              </button>
            </div>
            <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700" onClick={() => setResetMode((value) => !value)}>
              <KeyRound className="h-4 w-4" />
              Forgot password
            </button>
          </form>

          {resetMode ? (
            <form onSubmit={resetPassword} className="card mt-4 space-y-4 p-6">
              <div>
                <p className="font-bold text-slate-950">Reset by Twilio OTP</p>
                <p className="text-sm text-slate-500">The account must have a phone number saved by a manager.</p>
              </div>
              <label className="block">
                <span className="label">Username or email</span>
                <input className="input mt-1" value={reset.username} onChange={(event) => setReset({ ...reset, username: event.target.value })} />
              </label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="label">OTP</span>
                  <input className="input mt-1" value={reset.otp} onChange={(event) => setReset({ ...reset, otp: event.target.value })} />
                </label>
                <button type="button" className="btn-secondary self-end" onClick={sendOtp} disabled={loading}>
                  Send OTP
                </button>
              </div>
              <label className="block">
                <span className="label">New password</span>
                <input className="input mt-1" type="password" value={reset.newPassword} onChange={(event) => setReset({ ...reset, newPassword: event.target.value })} />
              </label>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                Reset password
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function Workspace({ user, workspace, setWorkspace, onRefresh, onLogout }) {
  const [page, setPage] = useState(user.role === 'manager' ? 'dashboard' : 'tasks')
  const nav =
    user.role === 'manager'
      ? [
          ['dashboard', 'Dashboard', BarChart3],
          ['tasks', 'Tasks', FileCheck2],
          ['employees', 'Employees', Users],
          ['audit', 'Audit Logs', ShieldCheck],
          ['profile', 'Profile', UserRound],
          ['chat', 'AI Chat', MessageCircle],
        ]
      : [
          ['dashboard', 'Dashboard', BarChart3],
          ['tasks', 'My Tasks', FileCheck2],
          ['logs', 'Work Logs', Clock3],
          ['profile', 'Profile', UserRound],
          ['chat', 'AI Chat', MessageCircle],
        ]
  const pageTitle = nav.find(([key]) => key === page)?.[1] || 'Dashboard'

  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950">WorkFlow</p>
              <p className="text-xs font-semibold uppercase text-teal-700">{user.role} workspace</p>
            </div>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPage(key)}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition lg:w-full ${
                page === key ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.title}</p>
              <p className="truncate text-xs text-slate-400">{user.username}</p>
            </div>
          </div>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-teal-700">PostgreSQL Live Workspace</p>
              <h1 className="text-2xl font-bold text-slate-950">{pageTitle}</h1>
              <p className="text-sm text-slate-500">Tasks, users, working hours, AI review, and audit logs are served by the API.</p>
            </div>
            <button type="button" className="btn-secondary lg:hidden" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {page === 'dashboard' ? <Dashboard user={user} workspace={workspace} /> : null}
          {user.role === 'manager' && page === 'tasks' ? <ManagerTasks workspace={workspace} setWorkspace={setWorkspace} /> : null}
          {user.role === 'manager' && page === 'employees' ? <EmployeesView workspace={workspace} setWorkspace={setWorkspace} /> : null}
          {user.role === 'manager' && page === 'audit' ? <AuditView auditLogs={workspace.auditLogs} /> : null}
          {user.role === 'employee' && page === 'tasks' ? <EmployeeTasks user={user} workspace={workspace} setWorkspace={setWorkspace} /> : null}
          {user.role === 'employee' && page === 'logs' ? <LogsView user={user} workLogs={workspace.workLogs} /> : null}
          {page === 'profile' ? <ProfileView user={user} workspace={workspace} /> : null}
          {page === 'chat' ? <ChatPanel user={user} workspace={workspace} onRefresh={onRefresh} /> : null}
        </div>
      </main>
    </div>
  )
}

function Dashboard({ user, workspace }) {
  return user.role === 'manager' ? <ManagerDashboard workspace={workspace} /> : <EmployeeDashboard user={user} workspace={workspace} />
}

function Avatar({ user, size = 'md' }) {
  const classes = size === 'lg' ? 'h-20 w-20 text-xl' : 'h-10 w-10 text-sm'
  if (user?.profilePhotoUrl) {
    return <img className={`${classes} rounded-lg object-cover ring-1 ring-slate-200`} src={user.profilePhotoUrl} alt={`${user.name} profile`} />
  }
  return (
    <div className={`${classes} flex shrink-0 items-center justify-center rounded-lg bg-teal-50 font-bold text-teal-700 ring-1 ring-teal-100`}>
      {(user?.name || user?.username || 'U').slice(0, 1).toUpperCase()}
    </div>
  )
}

function ManagerDashboard({ workspace }) {
  const { employees, tasks, workLogs } = workspace
  const stats = taskStats(tasks)
  const averageAi = workLogs.length ? Math.round(workLogs.reduce((sum, log) => sum + log.aiScore, 0) / workLogs.length) : 0
  const totalHours = workLogs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0)
  const reviewQueue = workLogs.filter((log) => log.aiStatus !== 'Good')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSummary() {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/ai/summary', { method: 'POST', body: JSON.stringify({}) })
      setSummary(result.summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Tasks" value={stats.total} icon={FileCheck2} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Open Work" value={stats.pending} icon={Clock3} tone="indigo" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} tone="rose" />
        <StatCard label="Employees" value={employees.length} icon={Users} tone="amber" />
        <StatCard label="Hours Logged" value={totalHours.toFixed(1)} icon={Activity} tone="teal" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">Gemini Manager Summary</h2>
              <p className="text-sm text-slate-500">Uses tasks, logs, employee hours, and AI risk signals.</p>
            </div>
            <button type="button" className="btn-primary" onClick={handleSummary} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </button>
          </div>
          {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <pre className="mt-4 min-h-56 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {summary || 'Generate a live AI summary after employees and tasks are added.'}
          </pre>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-950">Review Queue</h2>
            <Badge className="bg-teal-50 text-teal-700 ring-teal-200">{averageAi}% avg AI</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {reviewQueue.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{log.employeeName}</p>
                  <Badge className={aiStatusClass(log.aiStatus)}>{log.aiStatus}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{log.taskTitle}</p>
                <p className="mt-2 text-sm text-slate-700">{log.aiFeedback}</p>
              </div>
            ))}
            {!reviewQueue.length ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">No risky logs yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function ManagerTasks({ workspace, setWorkspace }) {
  const { employees, tasks, attachments } = workspace
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: employees[0]?.id || '',
    deadline: new Date().toISOString().slice(0, 10),
    priority: 'Standard',
    attachments: [],
  })

  const filtered = tasks.filter((task) => {
    const text = `${task.title} ${task.description} ${task.assignedEmployeeName}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === 'All' || task.status === statusFilter)
  })

  async function createTask(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({ ...form, assignedTo: form.assignedTo || employees[0]?.id }) })
      setWorkspace((current) => ({ ...current, tasks: [result.task, ...current.tasks], attachments: [...(result.attachments || []), ...current.attachments] }))
      setForm((current) => ({ ...current, title: '', description: '', attachments: [] }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <form onSubmit={createTask} className="card h-fit space-y-4 p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Create Task</h2>
          <p className="text-sm text-slate-500">No demo data is loaded. Add employees first, then assign work.</p>
        </div>
        {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <label className="block">
          <span className="label">Task title</span>
          <input className="input mt-1" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea className="input mt-1 min-h-28" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <label className="block">
          <span className="label">Assign employee</span>
          <select className="input mt-1" required value={form.assignedTo || employees[0]?.id || ''} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.department}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Deadline</span>
            <input className="input mt-1" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Priority</span>
            <select className="input mt-1" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {['Standard', 'Low', 'Medium', 'High', 'Critical'].map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>
        <FileDrop files={form.attachments} onChange={(files) => setForm({ ...form, attachments: files })} label="Assignment files" />
        <button type="submit" className="btn-primary w-full" disabled={saving || !employees.length}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create Task
        </button>
      </form>

      <section>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search tasks, assignees, descriptions" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select className="input pl-9" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="space-y-4">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} attachments={attachments.filter((file) => file.taskId === task.id)} />
          ))}
          {!filtered.length ? <EmptyState title="No tasks found" message="Create a task or adjust your filters." /> : null}
        </div>
      </section>
    </div>
  )
}

function EmployeesView({ workspace, setWorkspace }) {
  const { employees, tasks, workLogs } = workspace
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    title: 'Employee',
    department: 'Operations',
    dailyTargetHours: 8,
    profilePhotoUrl: '',
    termsAccepted: false,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function createEmployee(event) {
    event.preventDefault()
    const validationError = validateEmployeeForm(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest('/employees', { method: 'POST', body: JSON.stringify(form) })
      setWorkspace((current) => ({ ...current, employees: [...current.employees, result.employee] }))
      setForm({ username: '', name: '', email: '', phone: '', password: '', title: 'Employee', department: 'Operations', dailyTargetHours: 8, profilePhotoUrl: '', termsAccepted: false })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function uploadProfilePhoto(fileList) {
    const [photo] = await filesToPayload(fileList)
    if (photo) setForm({ ...form, profilePhotoUrl: photo.fileData })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <form onSubmit={createEmployee} className="card h-fit space-y-4 p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Add Employee</h2>
          <p className="text-sm text-slate-500">Phone is used for Twilio password reset OTP.</p>
        </div>
        {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Username</span>
            <input className="input mt-1" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input className="input mt-1" required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className="label">Full name</span>
          <input className="input mt-1" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Email</span>
            <input className="input mt-1" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="input mt-1" placeholder="+91..." value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Department</span>
            <input className="input mt-1" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Daily hours</span>
            <input className="input mt-1" type="number" min="1" max="24" step="0.5" value={form.dailyTargetHours} onChange={(event) => setForm({ ...form, dailyTargetHours: event.target.value })} />
          </label>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <Avatar user={{ name: form.name || form.username || 'New', profilePhotoUrl: form.profilePhotoUrl }} />
          <label className="btn-secondary cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            Profile photo
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => uploadProfilePhoto(event.target.files)} />
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <input className="mt-1" type="checkbox" checked={form.termsAccepted} onChange={(event) => setForm({ ...form, termsAccepted: event.target.checked })} />
          <span>I accept the employee account terms, including responsible system use, accurate work logging, and manager-controlled access.</span>
        </label>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add Employee
        </button>
      </form>

      <section className="grid gap-4 xl:grid-cols-2">
        {employees.map((employee) => {
          const employeeTasks = tasks.filter((task) => task.assignedTo === employee.id)
          const logs = workLogs.filter((log) => log.employeeId === employee.id)
          const stats = taskStats(employeeTasks)
          const weekHours = hoursFor(workLogs, employee.id)
          const dayHours = todayHours(workLogs, employee.id)
          const target = Number(employee.dailyTargetHours || 8)
          const utilization = Math.min(100, Math.round((weekHours / (target * 5 || 1)) * 100))
          return (
            <article key={employee.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={employee} />
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-950">{employee.name}</h2>
                    <p className="truncate text-sm text-slate-500">{employee.title} - {employee.department}</p>
                    <p className="truncate text-xs text-slate-400">{employee.username}</p>
                  </div>
                </div>
                <Badge className="bg-teal-50 text-teal-700 ring-teal-200">{target}h/day</Badge>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
                <Metric label="Tasks" value={stats.total} />
                <Metric label="Done" value={stats.completed} tone="emerald" />
                <Metric label="Today" value={dayHours.toFixed(1)} tone="teal" />
                <Metric label="Week" value={weekHours.toFixed(1)} tone="indigo" />
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Weekly utilization</span>
                  <span>{utilization}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${utilization}%` }} />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <button type="button" className="btn-secondary w-full" onClick={() => setSelectedEmployee({ ...employee, stats, weekHours, dayHours, utilization })}>
                  <UserRound className="h-4 w-4" />
                  View Profile
                </button>
                {logs.slice(0, 2).map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-950">{log.taskTitle}</p>
                      <Badge className={aiStatusClass(log.aiStatus)}>{log.aiStatus}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{log.hoursWorked}h - {log.aiFeedback}</p>
                  </div>
                ))}
                {!logs.length ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No work logs submitted.</p> : null}
              </div>
            </article>
          )
        })}
        {!employees.length ? <EmptyState title="No employees yet" message="Add employees to assign tasks and track working hours." /> : null}
      </section>
      {selectedEmployee ? (
        <EmployeeProfileModal employee={selectedEmployee} tasks={tasks.filter((task) => task.assignedTo === selectedEmployee.id)} logs={workLogs.filter((log) => log.employeeId === selectedEmployee.id)} onClose={() => setSelectedEmployee(null)} />
      ) : null}
    </div>
  )
}

function validateEmployeeForm(form) {
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(form.username || '')) return 'Username must be 3-32 characters and use letters, numbers, dots, underscores, or hyphens.'
  if (form.email && !emailRegex.test(form.email)) return 'Enter a valid email address.'
  if (form.phone && !phoneRegex.test(form.phone)) return 'Phone must be in international format, for example +919876543210.'
  if (!passwordRegex.test(form.password || '')) return 'Password must be at least 8 characters and include one letter and one number.'
  if (!form.termsAccepted) return 'Terms and conditions must be accepted.'
  return ''
}

function EmployeeProfileModal({ employee, tasks, logs, onClose }) {
  const completed = tasks.filter((task) => task.status === 'Completed').length
  const aiAverage = logs.length ? Math.round(logs.reduce((sum, log) => sum + Number(log.aiScore || 0), 0) / logs.length) : 0
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <section className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar user={employee} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-slate-950">{employee.name}</h2>
              <p className="text-sm text-slate-500">{employee.title} - {employee.department}</p>
              <p className="text-xs text-slate-400">{employee.email || employee.username}</p>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric label="Tasks" value={tasks.length} />
          <Metric label="Done" value={completed} tone="emerald" />
          <Metric label="Week Hours" value={employee.weekHours?.toFixed ? employee.weekHours.toFixed(1) : '0.0'} tone="teal" />
          <Metric label="AI Avg" value={`${aiAverage}%`} tone="indigo" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section>
            <h3 className="font-bold text-slate-950">Recent Tasks</h3>
            <div className="mt-3 space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-950">{task.title}</p>
                  <p className="text-sm text-slate-500">{task.status} - {formatDate(task.deadline)}</p>
                </div>
              ))}
              {!tasks.length ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No tasks assigned.</p> : null}
            </div>
          </section>
          <section>
            <h3 className="font-bold text-slate-950">Recent Work Logs</h3>
            <div className="mt-3 space-y-2">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-950">{log.taskTitle}</p>
                  <p className="text-sm text-slate-500">{log.hoursWorked}h - {log.aiStatus}</p>
                </div>
              ))}
              {!logs.length ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No work logs yet.</p> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    teal: 'bg-teal-50 text-teal-700',
  }
  return (
    <div className={`rounded-lg p-3 ${tones[tone]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="font-semibold">{label}</p>
    </div>
  )
}

function EmployeeDashboard({ user, workspace }) {
  const myTasks = workspace.tasks.filter((task) => task.assignedTo === user.id)
  const myLogs = workspace.workLogs.filter((log) => log.employeeId === user.id)
  const stats = taskStats(myTasks)
  const aiAverage = myLogs.length ? Math.round(myLogs.reduce((sum, log) => sum + log.aiScore, 0) / myLogs.length) : 0
  const dayHours = todayHours(workspace.workLogs, user.id)
  const weekHours = hoursFor(workspace.workLogs, user.id)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Assigned" value={stats.total} icon={FileCheck2} />
        <StatCard label="Open" value={stats.pending} icon={Clock3} tone="indigo" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} tone="rose" />
        <StatCard label="Today Hours" value={dayHours.toFixed(1)} icon={Activity} tone="teal" />
        <StatCard label="AI Average" value={`${aiAverage}%`} icon={TrendingUp} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {myTasks.map((task) => (
            <TaskCard key={task.id} task={task} attachments={workspace.attachments.filter((file) => file.taskId === task.id)} />
          ))}
          {!myTasks.length ? <EmptyState title="No assigned tasks" message="Your manager has not assigned work yet." /> : null}
        </div>
        <section className="card h-fit p-5">
          <h2 className="font-bold text-slate-950">Working Hours</h2>
          <div className="mt-4 space-y-3">
            <FocusRow icon={CalendarDays} label="Nearest deadline" value={myTasks[0] ? formatDate(myTasks[0].deadline) : 'None'} />
            <FocusRow icon={Clock3} label="Today logged" value={`${dayHours.toFixed(1)}h`} />
            <FocusRow icon={Activity} label="Last 7 days" value={`${weekHours.toFixed(1)}h`} />
          </div>
        </section>
      </div>
    </div>
  )
}

function FocusRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Icon className="h-4 w-4 text-teal-700" />
        {label}
      </div>
      <p className="text-sm font-bold text-slate-950">{value}</p>
    </div>
  )
}

async function filesToPayload(fileList) {
  const files = Array.from(fileList || []).slice(0, 5)
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve({ fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size, fileData: reader.result })
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    ),
  )
}

function FileDrop({ files, onChange, label }) {
  const [active, setActive] = useState(false)

  async function addFiles(fileList) {
    const next = await filesToPayload(fileList)
    onChange([...(files || []), ...next].slice(0, 5))
  }

  return (
    <div
      className={`rounded-lg border border-dashed p-4 transition ${active ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50'}`}
      onDragOver={(event) => {
        event.preventDefault()
        setActive(true)
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setActive(false)
        addFiles(event.dataTransfer.files)
      }}
    >
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UploadCloud className="h-4 w-4 text-teal-700" />
          {label}
        </span>
        <span className="text-xs text-slate-500">Drop or browse</span>
        <input className="sr-only" type="file" multiple onChange={(event) => addFiles(event.target.files)} />
      </label>
      {files?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <button key={`${file.fileName}-${index}`} type="button" className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}>
              <Paperclip className="h-3.5 w-3.5 text-teal-700" />
              {file.fileName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EmployeeTasks({ user, workspace, setWorkspace }) {
  const myTasks = workspace.tasks.filter((task) => task.assignedTo === user.id)
  const [drafts, setDrafts] = useState({})
  const [hours, setHours] = useState({})
  const [attachmentDrafts, setAttachmentDrafts] = useState({})
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')

  async function updateStatus(taskId, status) {
    setError('')
    try {
      const result = await apiRequest(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setWorkspace((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? result.task : task)),
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function submitLog(task) {
    const logText = drafts[task.id]?.trim()
    if (!logText) return
    setError('')
    try {
      const result = await apiRequest('/work-logs', {
        method: 'POST',
        body: JSON.stringify({ taskId: task.id, logText, hoursWorked: Number(hours[task.id] || 1), attachments: attachmentDrafts[task.id] || [] }),
      })
      setWorkspace((current) => ({ ...current, workLogs: [result.workLog, ...current.workLogs], attachments: [...(result.attachments || []), ...current.attachments.filter((file) => file.taskId !== task.id)] }))
      setDrafts((current) => ({ ...current, [task.id]: '' }))
      setHours((current) => ({ ...current, [task.id]: '' }))
      setAttachmentDrafts((current) => ({ ...current, [task.id]: [] }))
      setLastResult(result.workLog)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {lastResult ? (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={aiStatusClass(lastResult.aiStatus)}>{lastResult.aiStatus}</Badge>
            <p className="text-sm font-semibold text-slate-950">AI Score: {lastResult.aiScore}/100</p>
            <p className="text-sm text-slate-600">{lastResult.hoursWorked}h logged - {lastResult.aiFeedback}</p>
          </div>
        </div>
      ) : null}
      {myTasks.map((task) => (
        <TaskCard key={task.id} task={task} attachments={workspace.attachments.filter((file) => file.taskId === task.id)}>
          <div className="grid gap-4 lg:grid-cols-[200px_120px_1fr]">
            <select className={`input ${statusClass(task.status)}`} value={task.status} onChange={(event) => updateStatus(task.id, event.target.value)}>
              {['Pending', 'In Progress', 'Completed'].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              placeholder="Hours"
              value={hours[task.id] || ''}
              onChange={(event) => setHours({ ...hours, [task.id]: event.target.value })}
            />
            <div className="space-y-3">
              <textarea
                className="input min-h-24"
                placeholder="Today's work, blockers, links, and measurable progress"
                value={drafts[task.id] || ''}
                onChange={(event) => setDrafts({ ...drafts, [task.id]: event.target.value })}
              />
              <FileDrop files={attachmentDrafts[task.id] || []} onChange={(files) => setAttachmentDrafts({ ...attachmentDrafts, [task.id]: files })} label="Work evidence files" />
              <button type="button" className="btn-primary" onClick={() => submitLog(task)}>
                <Send className="h-4 w-4" />
                Submit Work Log
              </button>
            </div>
          </div>
        </TaskCard>
      ))}
      {!myTasks.length ? <EmptyState title="No tasks assigned" message="New work will appear here once a manager assigns it." /> : null}
    </div>
  )
}

function LogsView({ user, workLogs }) {
  const logs = useMemo(() => workLogs.filter((log) => log.employeeId === user.id), [user.id, workLogs])
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {logs.map((log) => (
        <article key={log.id} className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">{log.taskTitle}</h2>
              <p className="text-xs text-slate-500">{formatDate(log.submittedAt)} - {log.hoursWorked}h</p>
            </div>
            <Badge className={aiStatusClass(log.aiStatus)}>{log.aiStatus}</Badge>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{log.logText}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[110px_1fr]">
            <div className="rounded-lg bg-teal-50 p-3 text-center">
              <p className="text-2xl font-bold text-teal-700">{log.aiScore}</p>
              <p className="text-xs font-semibold text-teal-700">AI Score</p>
            </div>
            <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">{log.aiFeedback}</p>
          </div>
        </article>
      ))}
      {!logs.length ? <EmptyState title="No logs yet" message="Submit a work log from My Tasks to see verification results." /> : null}
    </div>
  )
}

function AuditView({ auditLogs }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-bold text-slate-950">Audit Trail</h2>
        <p className="text-sm text-slate-500">Critical task, employee, and work-log actions are recorded in PostgreSQL.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 font-medium text-slate-950">{log.action}</td>
                <td className="px-4 py-3 text-slate-600">{log.userName}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.taskId || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProfileView({ user, workspace }) {
  const tasks = user.role === 'employee' ? workspace.tasks.filter((task) => task.assignedTo === user.id) : workspace.tasks
  const logs = user.role === 'employee' ? workspace.workLogs.filter((log) => log.employeeId === user.id) : workspace.workLogs
  const totalHours = logs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0)
  const aiAverage = logs.length ? Math.round(logs.reduce((sum, log) => sum + Number(log.aiScore || 0), 0) / logs.length) : 0

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="card h-fit p-5">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-950">{user.name}</h2>
            <p className="text-sm font-semibold uppercase text-teal-700">{user.role}</p>
            <p className="truncate text-sm text-slate-500">{user.title} - {user.department}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <FocusRow icon={UserRound} label="Username" value={user.username} />
          <FocusRow icon={Clock3} label="Daily target" value={`${Number(user.dailyTargetHours || 8)}h`} />
          <FocusRow icon={ShieldCheck} label="Terms" value={user.termsAcceptedAt ? 'Accepted' : user.role === 'manager' ? 'Manager seed' : 'Pending'} />
        </div>
      </section>

      <section className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Tasks" value={tasks.length} />
          <Metric label="Logs" value={logs.length} tone="indigo" />
          <Metric label="Hours" value={totalHours.toFixed(1)} tone="teal" />
          <Metric label="AI Avg" value={`${aiAverage}%`} tone="emerald" />
        </div>
        <section className="card p-5">
          <h3 className="font-bold text-slate-950">Profile Details</h3>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Email</p>
              <p className="font-medium text-slate-800">{user.email || 'Not set'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Phone</p>
              <p className="font-medium text-slate-800">{user.phone || 'Not set'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Created</p>
              <p className="font-medium text-slate-800">{formatDate(user.createdAt)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
              <p className="font-medium text-slate-800">{user.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}

function ChatPanel({ user, workspace, onRefresh }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ask me about this workspace, planning, blockers, employee hours, or anything else you need.' },
  ])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage(event) {
    event.preventDefault()
    const message = draft.trim()
    if (!message) return
    setDraft('')
    setMessages((current) => [...current, { role: 'user', text: message }])
    setLoading(true)
    try {
      const result = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          context: {
            user,
            counts: {
              employees: workspace.employees.length,
              tasks: workspace.tasks.length,
              workLogs: workspace.workLogs.length,
            },
            recentTasks: workspace.tasks.slice(0, 8),
            recentLogs: workspace.workLogs.slice(0, 8),
          },
        }),
      })
      setMessages((current) => [...current, { role: 'assistant', text: result.answer }])
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', text: err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card flex min-h-[70vh] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h2 className="font-bold text-slate-950">Gemini Chat Assistant</h2>
          <p className="text-sm text-slate-500">Server-side key, workspace-aware context, and PostgreSQL-backed data.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          Refresh data
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`max-w-3xl rounded-lg p-4 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-teal-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
        ))}
        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-white p-4 text-sm text-slate-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
            Thinking
          </div>
        ) : null}
      </div>
      <form onSubmit={sendMessage} className="grid gap-3 border-t border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
        <textarea className="input min-h-16" placeholder="Ask anything about the site or the work..." value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button type="submit" className="btn-primary self-end" disabled={loading}>
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </section>
  )
}
