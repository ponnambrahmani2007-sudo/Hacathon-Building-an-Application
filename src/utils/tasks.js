import { isOverdue } from './date'

export const priorities = ['Low', 'Medium', 'High', 'Critical']
export const statuses = ['Pending', 'In Progress', 'Completed']

export function taskStats(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'Completed').length,
    pending: tasks.filter((task) => task.status !== 'Completed').length,
    overdue: tasks.filter(isOverdue).length,
  }
}

export function priorityClass(priority) {
  return {
    Low: 'bg-sky-50 text-sky-700 ring-sky-200',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
    High: 'bg-orange-50 text-orange-700 ring-orange-200',
    Critical: 'bg-rose-50 text-rose-700 ring-rose-200',
  }[priority] || 'bg-slate-50 text-slate-700 ring-slate-200'
}

export function statusClass(status) {
  return {
    Pending: 'bg-slate-100 text-slate-700 ring-slate-200',
    'In Progress': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }[status] || 'bg-slate-50 text-slate-700 ring-slate-200'
}

export function aiStatusClass(status) {
  return {
    Good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Suspicious: 'bg-amber-50 text-amber-700 ring-amber-200',
    Poor: 'bg-rose-50 text-rose-700 ring-rose-200',
  }[status] || 'bg-slate-50 text-slate-700 ring-slate-200'
}
