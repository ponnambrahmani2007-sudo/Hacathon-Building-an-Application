export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

export function formatDate(value) {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return 'No deadline'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function isOverdue(task) {
  const deadline = toDate(task.deadline)
  if (!deadline || task.status === 'Completed') return false
  const endOfDeadline = new Date(deadline)
  endOfDeadline.setHours(23, 59, 59, 999)
  return endOfDeadline < new Date()
}

export function deadlineText(task) {
  const deadline = toDate(task.deadline)
  if (!deadline) return 'No deadline'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)
  const days = Math.ceil((target - today) / 86400000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d left`
}
