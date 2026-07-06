import type { ConnectionStatus, PipelineStep } from '../types/api'
import { cn } from '../lib/cn'

interface SystemTerminalProps {
  title: string
  connectionStatus: ConnectionStatus
  currentStep: PipelineStep
  logs: string[]
}

const stepColors: Partial<Record<PipelineStep, string>> = {
  COMPLETED: 'text-emerald-400',
  FAILED: 'text-red-400',
  PARSING_POLICY: 'text-cyan-300',
  VECTOR_INDEXING: 'text-violet-300',
  PARSING_CLAIM: 'text-cyan-300',
  COGNITIVE_AUDIT: 'text-amber-300',
}

export function SystemTerminal({
  title,
  connectionStatus,
  currentStep,
  logs,
}: SystemTerminalProps) {
  return (
    <div className="glass-panel flex h-72 flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
        <h3 className="font-mono text-sm font-medium text-slate-200">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className={cn('font-mono', stepColors[currentStep] ?? 'text-slate-300')}>
            {currentStep}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-mono uppercase',
              connectionStatus === 'CONNECTED' && 'bg-emerald-500/20 text-emerald-300',
              connectionStatus === 'CONNECTING' && 'bg-amber-500/20 text-amber-300',
              connectionStatus === 'DISCONNECTED' && 'bg-slate-700 text-slate-400',
            )}
          >
            {connectionStatus}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
        {logs.length === 0 ? (
          <p className="text-slate-500">Awaiting pipeline events...</p>
        ) : (
          logs.map((line, index) => (
            <p key={`${line}-${index}`} className="mb-1 whitespace-pre-wrap break-words">
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
