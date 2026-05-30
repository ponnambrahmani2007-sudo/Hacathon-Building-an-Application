import { Loader2 } from 'lucide-react'

export default function LoadingState({ label = 'Loading data' }) {
  return (
    <div className="card flex min-h-44 items-center justify-center p-8 text-sm font-medium text-slate-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}
