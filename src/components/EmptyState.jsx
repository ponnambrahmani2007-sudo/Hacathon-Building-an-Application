import { Inbox } from 'lucide-react'

export default function EmptyState({ title, message }) {
  return (
    <div className="card flex min-h-44 flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  )
}
