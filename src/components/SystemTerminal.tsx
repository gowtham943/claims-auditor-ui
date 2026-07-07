import type { ConnectionStatus, PipelineStep } from '../types/api'
import {
  CONNECTION_STATUS_LABELS,
  formatPipelineStep,
} from '../config/userLabels'
import { cn } from '../lib/cn'

interface SystemTerminalProps {
  title: string
  connectionStatus: ConnectionStatus
  currentStep: PipelineStep
  logs: string[]
}

const stepColors: Partial<Record<PipelineStep, string>> = {
  COMPLETE: 'text-emerald-400',
  FAILED: 'text-red-400',
  READING_POLICY: 'text-cyan-300',
  ORGANIZING_POLICY: 'text-violet-300',
  READING_CLAIM: 'text-cyan-300',
  REVIEWING_CLAIM: 'text-amber-300',
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
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className={cn(stepColors[currentStep] ?? 'text-slate-300')}>
            {formatPipelineStep(currentStep)}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5',
              connectionStatus === 'CONNECTED' && 'bg-emerald-500/20 text-emerald-300',
              connectionStatus === 'CONNECTING' && 'bg-amber-500/20 text-amber-300',
              connectionStatus === 'DISCONNECTED' && 'bg-slate-700 text-slate-400',
            )}
          >
            {CONNECTION_STATUS_LABELS[connectionStatus]}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed text-slate-300">
        {logs.length === 0 ? (
          <p className="text-slate-500">Waiting for updates...</p>
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
