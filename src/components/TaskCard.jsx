import { CalendarClock, Paperclip } from 'lucide-react'
import Badge from './Badge'
import { deadlineText, formatDate, isOverdue } from '../utils/date'
import { priorityClass, statusClass } from '../utils/tasks'

export default function TaskCard({ task, attachments = [], children }) {
  return (
    <article className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs font-semibold text-slate-400">{task.id}</p>
            {task.createdAt ? <p className="text-xs text-slate-400">Created {formatDate(task.createdAt)}</p> : null}
          </div>
          <h3 className="text-base font-bold text-slate-950">{task.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{task.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {task.priority && task.priority !== 'Standard' ? <Badge className={priorityClass(task.priority)}>{task.priority}</Badge> : null}
          <Badge className={statusClass(task.status)}>{task.status}</Badge>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Assigned to</p>
          <p className="font-medium text-slate-800">{task.assignedEmployeeName || 'Unassigned'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Deadline</p>
          <p className="font-medium text-slate-800">{formatDate(task.deadline)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Countdown</p>
          <p className={`inline-flex items-center gap-1 font-medium ${isOverdue(task) ? 'text-rose-700' : 'text-slate-800'}`}>
            <CalendarClock className="h-4 w-4" />
            {deadlineText(task)}
          </p>
        </div>
      </div>
      {typeof task.progress === 'number' ? (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }} />
          </div>
        </div>
      ) : null}
      {attachments.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <a
              key={file.id}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
              href={file.fileData}
              download={file.fileName}
            >
              <Paperclip className="h-3.5 w-3.5 text-teal-700" />
              {file.fileName}
            </a>
          ))}
        </div>
      ) : null}
      {children ? <div className="mt-5 border-t border-slate-100 pt-4">{children}</div> : null}
    </article>
  )
}
