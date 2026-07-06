import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { API_ENDPOINTS } from '../config/endpoints'
import type { AuditReport, ClaimAuditDetail, ClaimAuditSummary } from '../types/api'
import { cn } from '../lib/cn'

interface AuditingConsoleProps {
  liveReport?: AuditReport | null
  liveClaimId?: string | null
}

function StatusBadge({ status }: { status: AuditReport['audit_status'] }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        status === 'APPROVED' && 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40',
        status === 'FLAGGED_ANOMALY' && 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 pulse-amber',
        status === 'DENIED' && 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40',
      )}
    >
      {status}
    </span>
  )
}

function toAuditReport(detail: ClaimAuditDetail): AuditReport {
  return {
    audit_status: detail.audit_status,
    total_billed_amount: detail.total_billed_amount,
    expected_patient_responsibility: detail.expected_patient_responsibility,
    violations: detail.violations,
    raw_claim_markdown: detail.raw_claim_markdown,
  }
}

function formatAuditedAt(value?: string | null): string {
  if (!value) return 'Audit time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Audit time unavailable'
  return date.toLocaleString()
}

export function AuditingConsole({ liveReport, liveClaimId }: AuditingConsoleProps) {
  const { token, isAuthenticated } = useAuth()
  const [history, setHistory] = useState<ClaimAuditSummary[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<ClaimAuditSummary | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState('')
  const [expandedViolation, setExpandedViolation] = useState<number | null>(0)

  const refreshHistory = useCallback(async () => {
    if (!token) {
      setHistory([])
      return
    }

    setLoadingHistory(true)
    setError('')
    try {
      const audits = await apiFetch<ClaimAuditSummary[]>(API_ENDPOINTS.ingestion.claims, {
        token,
      })
      setHistory(audits)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit history')
    } finally {
      setLoadingHistory(false)
    }
  }, [token])

  const loadAuditDetail = useCallback(
    async (claimId: string) => {
      if (!token) return

      setLoadingDetail(true)
      setError('')
      try {
        const detail = await apiFetch<ClaimAuditDetail>(
          API_ENDPOINTS.ingestion.claimDetail(claimId),
          { token },
        )
        setSelectedClaimId(claimId)
        setSelectedMeta(detail)
        setSelectedReport(toAuditReport(detail))
        setExpandedViolation(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit detail')
      } finally {
        setLoadingDetail(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setHistory([])
      setSelectedClaimId(null)
      setSelectedReport(null)
      setSelectedMeta(null)
      return
    }

    void refreshHistory()
  }, [isAuthenticated, token, refreshHistory])

  useEffect(() => {
    if (!liveClaimId || !liveReport) return

    setSelectedClaimId(liveClaimId)
    setSelectedReport(liveReport)
    setSelectedMeta((current) =>
      current?.id === liveClaimId
        ? current
        : {
            id: liveClaimId,
            patient_name: 'Latest audit',
            policy_id: '',
            policy_plan_name: '',
            audit_status: liveReport.audit_status,
            total_billed_amount: liveReport.total_billed_amount,
            expected_patient_responsibility: liveReport.expected_patient_responsibility,
            violation_count: liveReport.violations.length,
          },
    )
    void refreshHistory()
  }, [liveClaimId, liveReport, refreshHistory])

  const report = selectedReport

  return (
    <div className="grid h-[calc(100vh-14rem)] min-h-[32rem] grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="glass-panel flex flex-col overflow-hidden rounded-xl">
        <header className="border-b border-slate-700/80 px-4 py-3">
          <h3 className="text-sm font-medium text-slate-200">Audit History</h3>
          <p className="mt-1 text-xs text-slate-500">Completed claim reviews for your account</p>
        </header>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="px-2 py-4 text-sm text-slate-500">No completed audits yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => {
                const isSelected = selectedClaimId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void loadAuditDetail(item.id)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-3 text-left transition',
                      isSelected
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-500',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100">{item.patient_name}</p>
                      <StatusBadge status={item.audit_status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{item.policy_plan_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ${item.total_billed_amount.toFixed(2)} billed · {item.violation_count} violations
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">{formatAuditedAt(item.audited_at)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col gap-4">
        {error && <p className="text-sm text-red-300">{error}</p>}

        {loadingDetail ? (
          <div className="glass-panel flex flex-1 items-center justify-center rounded-xl text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !report ? (
          <div className="glass-panel flex flex-1 items-center justify-center rounded-xl p-8 text-slate-400">
            Select an audit from history or complete a new claim audit.
          </div>
        ) : (
          <>
            {selectedMeta && (
              <div className="glass-panel rounded-xl px-4 py-3 text-sm text-slate-300">
                Reviewing <span className="font-medium text-slate-100">{selectedMeta.patient_name}</span>
                {' · '}
                {selectedMeta.policy_plan_name}
                {' · '}
                <span className="font-mono text-xs text-slate-500">{selectedMeta.id}</span>
              </div>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-xl">
                <header className="border-b border-slate-700/80 px-4 py-3">
                  <h3 className="text-sm font-medium text-slate-200">Claim Source Markdown</h3>
                </header>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
                    {report.raw_claim_markdown || 'Raw claim markdown unavailable for this audit.'}
                  </pre>
                </div>
              </section>

              <section className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-xl">
                <header className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
                  <h3 className="text-sm font-medium text-slate-200">Audit Intelligence Panel</h3>
                  <StatusBadge status={report.audit_status} />
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Total Billed</p>
                      <p className="mt-1 text-xl font-semibold text-slate-100">
                        ${report.total_billed_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Expected Patient Resp.</p>
                      <p className="mt-1 text-xl font-semibold text-emerald-300">
                        ${report.expected_patient_responsibility.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs uppercase tracking-wide text-slate-500">Violations</h4>
                    {report.violations.length === 0 ? (
                      <p className="text-sm text-emerald-300">No compliance violations detected.</p>
                    ) : (
                      <div className="space-y-2">
                        {report.violations.map((violation, index) => {
                          const isOpen = expandedViolation === index
                          return (
                            <div
                              key={`${violation.rule_name}-${index}`}
                              className="rounded-lg border border-slate-700 bg-slate-900/50"
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedViolation(isOpen ? null : index)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left"
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-100">{violation.rule_name}</p>
                                  <p
                                    className={cn(
                                      'text-xs',
                                      violation.severity === 'HIGH' ? 'text-red-300' : 'text-amber-300',
                                    )}
                                  >
                                    {violation.severity}
                                  </p>
                                </div>
                                {isOpen ? (
                                  <ChevronUp className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="space-y-2 border-t border-slate-700 px-3 py-3 text-sm">
                                  <p className="text-slate-300">{violation.description}</p>
                                  <div className="rounded-md border border-slate-600 bg-slate-950/70 p-2">
                                    <p className="mb-1 text-xs uppercase text-slate-500">Policy Citation</p>
                                    <p className="whitespace-pre-wrap text-xs text-slate-300">
                                      {violation.policy_citation}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
