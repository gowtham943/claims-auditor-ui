export type UserRole = 'ADMIN' | 'AUDITOR'

export interface UserProfile {
  id: string
  username: string
  role: UserRole
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface PolicyIngestionResponse {
  status: string
  policy_id: string
  message: string
}

export interface ClaimIngestionResponse {
  status: string
  claim_id: string
  message: string
}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'

export type PipelineStep =
  | 'RECEIVED'
  | 'READING_POLICY'
  | 'ORGANIZING_POLICY'
  | 'SAVING'
  | 'READING_CLAIM'
  | 'REVIEWING_CLAIM'
  | 'COMPLETE'
  | 'FAILED'

export interface ViolationDetail {
  rule_name: string
  severity: 'HIGH' | 'MEDIUM'
  description: string
  policy_citation: string
}

export interface AuditReport {
  audit_status: 'VALID' | 'NEEDS_REVIEW' | 'INVALID'
  total_billed_amount: number
  expected_patient_responsibility: number
  violations: ViolationDetail[]
  raw_claim_markdown?: string
}

export interface WebSocketEvent {
  claim_id: string
  step: PipelineStep
  message: string
  payload: Record<string, unknown>
}

export interface ChatQueryRequest {
  policy_id: string
  prompt: string
}

export interface ChatQueryResponse {
  answer: string
  retrieved_citations: string[]
}

export interface ClaimAuditSummary {
  id: string
  patient_name: string
  policy_id: string
  policy_plan_name: string
  audit_status: AuditReport['audit_status']
  total_billed_amount: number
  expected_patient_responsibility: number
  violation_count: number
  audited_at?: string | null
}

export interface ClaimAuditDetail extends ClaimAuditSummary {
  violations: ViolationDetail[]
  raw_claim_markdown: string
}

export interface PolicySummary {
  id: string
  plan_name: string
  geography: string
  plan_type: string
  source_url?: string | null
}

export interface IngestedPolicy {
  id: string
  planName: string
  geography: string
  planType: string
  ingestedAt: string
}
