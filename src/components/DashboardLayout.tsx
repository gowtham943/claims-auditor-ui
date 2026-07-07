import { useEffect, useState } from 'react'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Scale,
  Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PolicyIngestionView } from './PolicyIngestionView'
import { ClaimsAuditDesk } from './ClaimsAuditDesk'
import { AuditingConsole } from './AuditingConsole'
import { RagChatAssistant } from './RagChatAssistant'
import type { AuditReport } from '../types/api'
import { TAB_LABELS } from '../config/userLabels'
import { cn } from '../lib/cn'

type DashboardTab = 'policy' | 'claims' | 'console' | 'chat'

const tabs: { id: DashboardTab; label: string; icon: typeof Shield }[] = [
  { id: 'policy', label: TAB_LABELS.policy, icon: FileText },
  { id: 'claims', label: TAB_LABELS.claims, icon: Scale },
  { id: 'console', label: TAB_LABELS.console, icon: LayoutDashboard },
  { id: 'chat', label: TAB_LABELS.chat, icon: MessageSquare },
]

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('policy')
  const [completedAudit, setCompletedAudit] = useState<AuditReport | null>(null)
  const [completedClaimId, setCompletedClaimId] = useState<string | null>(null)

  useEffect(() => {
    if (completedAudit) {
      setActiveTab('console')
    }
  }, [completedAudit])

  return (
    <div className="dashboard-bg min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">ClaimsAuditor AI</h1>
              <p className="text-xs text-slate-400">Check your health insurance claims online</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-slate-200">{user?.username}</p>
              <p className="text-xs text-emerald-300">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 lg:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {activeTab === 'policy' && <PolicyIngestionView />}
        {activeTab === 'claims' && (
          <ClaimsAuditDesk
            onAuditComplete={(claimId, report) => {
              setCompletedClaimId(claimId)
              setCompletedAudit(report)
            }}
          />
        )}
        {activeTab === 'console' && (
          <AuditingConsole liveClaimId={completedClaimId} liveReport={completedAudit} />
        )}
        {activeTab === 'chat' && <RagChatAssistant />}
      </main>
    </div>
  )
}
