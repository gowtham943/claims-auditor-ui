import type { AuditReport, ConnectionStatus, PipelineStep } from '../types/api'

export const TAB_LABELS = {
  policy: 'Upload Policy',
  claims: 'Check a Claim',
  console: 'Claim Results',
  chat: 'Policy Help',
} as const

export const PIPELINE_STEP_LABELS: Record<PipelineStep, string> = {
  RECEIVED: 'Received',
  READING_POLICY: 'Reading policy',
  ORGANIZING_POLICY: 'Organizing policy',
  SAVING: 'Saving policy',
  READING_CLAIM: 'Reading claim',
  REVIEWING_CLAIM: 'Checking claim',
  COMPLETE: 'Complete',
  FAILED: 'Could not finish',
}

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  CONNECTING: 'Connecting',
  CONNECTED: 'Live updates on',
  DISCONNECTED: 'Not connected',
}

export const AUDIT_STATUS_LABELS: Record<AuditReport['audit_status'], string> = {
  VALID: 'Valid claim',
  NEEDS_REVIEW: 'Issues found',
  INVALID: 'Invalid claim',
}

export const CLAIM_WIZARD_STEPS: { step: PipelineStep; label: string }[] = [
  { step: 'RECEIVED', label: 'Claim received' },
  { step: 'READING_CLAIM', label: 'Reading your documents' },
  { step: 'REVIEWING_CLAIM', label: 'Checking against policy' },
  { step: 'COMPLETE', label: 'Result ready' },
]

export function formatPipelineStep(step: PipelineStep): string {
  return PIPELINE_STEP_LABELS[step] ?? step.replaceAll('_', ' ').toLowerCase()
}

export function formatAuditStatus(status: AuditReport['audit_status']): string {
  return AUDIT_STATUS_LABELS[status] ?? status
}
