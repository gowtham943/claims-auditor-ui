import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatPipelineStep } from '../config/userLabels'
import type {
  AuditReport,
  ConnectionStatus,
  PipelineStep,
  WebSocketEvent,
} from '../types/api'

import { wsUrl } from '../config/endpoints'

interface UseWebSocketOptions {
  trackingId: string | null
  enabled?: boolean
}

interface UseWebSocketResult {
  connectionStatus: ConnectionStatus
  currentStep: PipelineStep
  streamLogs: string[]
  auditPayload: AuditReport | null
  reset: () => void
}

function parseAuditPayload(payload: Record<string, unknown>): AuditReport | null {
  if (!payload || typeof payload.audit_status !== 'string') {
    return null
  }

  return {
    audit_status: payload.audit_status as AuditReport['audit_status'],
    total_billed_amount: Number(payload.total_billed_amount ?? 0),
    expected_patient_responsibility: Number(payload.expected_patient_responsibility ?? 0),
    violations: Array.isArray(payload.violations)
      ? (payload.violations as AuditReport['violations'])
      : [],
    raw_claim_markdown:
      typeof payload.raw_claim_markdown === 'string' ? payload.raw_claim_markdown : undefined,
  }
}

export function useWebSocket({
  trackingId,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketResult {
  const { token } = useAuth()
  const socketRef = useRef<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED')
  const [currentStep, setCurrentStep] = useState<PipelineStep>('RECEIVED')
  const [streamLogs, setStreamLogs] = useState<string[]>([])
  const [auditPayload, setAuditPayload] = useState<AuditReport | null>(null)

  const reset = useCallback(() => {
    setConnectionStatus('DISCONNECTED')
    setCurrentStep('RECEIVED')
    setStreamLogs([])
    setAuditPayload(null)
  }, [])

  useEffect(() => {
    if (!enabled || !trackingId || !token) {
      setConnectionStatus('DISCONNECTED')
      return
    }

    reset()
    setConnectionStatus('CONNECTING')

    const socket = new WebSocket(wsUrl(trackingId, token))
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionStatus('CONNECTED')
      setStreamLogs((prev) => [...prev, 'Connected. You will see live progress here.'])
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketEvent
        const step = data.step as PipelineStep
        setCurrentStep(step)
        setStreamLogs((prev) => [
          ...prev,
          `${formatPipelineStep(step)}: ${data.message}`,
        ])

        if (step === 'COMPLETE') {
          const parsed = parseAuditPayload(data.payload)
          if (parsed) {
            setAuditPayload(parsed)
          }
        }

        if (step === 'FAILED') {
          setStreamLogs((prev) => [...prev, 'This step could not be completed.'])
        }
      } catch {
        setStreamLogs((prev) => [...prev, String(event.data)])
      }
    }

    socket.onerror = () => {
      setConnectionStatus('DISCONNECTED')
      setStreamLogs((prev) => [...prev, 'Connection problem. Please refresh and try again.'])
    }

    socket.onclose = () => {
      setConnectionStatus('DISCONNECTED')
      setStreamLogs((prev) => [...prev, 'Updates ended.'])
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [trackingId, token, enabled, reset])

  return {
    connectionStatus,
    currentStep,
    streamLogs,
    auditPayload,
    reset,
  }
}
