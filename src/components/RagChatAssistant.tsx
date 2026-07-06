import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bot, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAppContext } from '../context/AppContext'
import { API_ENDPOINTS, apiUrl } from '../config/endpoints'
import type { ChatQueryResponse } from '../types/api'
import { cn } from '../lib/cn'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
}

export function RagChatAssistant() {
  const { token } = useAuth()
  const { ingestedPolicies, activeSelectedPolicyId, setActiveSelectedPolicyId } = useAppContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openCitations, setOpenCitations] = useState<Record<string, boolean>>({})

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!prompt.trim() || !token || !activeSelectedPolicyId) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
    }
    setMessages((prev) => [...prev, userMessage])
    setPrompt('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch(apiUrl(API_ENDPOINTS.chat.query), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy_id: activeSelectedPolicyId,
          prompt: userMessage.content,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = (await response.json()) as ChatQueryResponse
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          citations: data.retrieved_citations,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel flex h-[calc(100vh-14rem)] min-h-[32rem] flex-col rounded-xl">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-emerald-400" />
          <h2 className="text-sm font-medium text-slate-100">Policy RAG Chat Assistant</h2>
        </div>
        <select
          value={activeSelectedPolicyId}
          onChange={(e) => setActiveSelectedPolicyId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="">Pin to policy...</option>
          {ingestedPolicies.map((policy) => (
            <option key={policy.id} value={policy.id}>
              {policy.planName} — {policy.id.slice(0, 8)}...
            </option>
          ))}
        </select>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Ask grounded policy questions after ingesting a rulebook. Example: &quot;What is the specialist copay?&quot;
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'max-w-3xl rounded-xl px-4 py-3 text-sm',
              message.role === 'user'
                ? 'ml-auto bg-emerald-500/15 text-slate-100'
                : 'mr-auto border border-slate-700 bg-slate-900/70 text-slate-200',
            )}
          >
            {message.role === 'assistant' ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p>{message.content}</p>
            )}

            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 border-t border-slate-700 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCitations((prev) => ({
                      ...prev,
                      [message.id]: !prev[message.id],
                    }))
                  }
                  className="flex items-center gap-1 text-xs text-emerald-300"
                >
                  {openCitations[message.id] ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  View {message.citations.length} retrieved citations
                </button>
                {openCitations[message.id] && (
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-slate-400">
                    {message.citations.map((citation, index) => (
                      <li key={index} className="rounded border border-slate-700 bg-slate-950/60 p-2 whitespace-pre-wrap">
                        {citation}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-700/80 p-4">
        {error && <p className="mb-2 text-sm text-red-300">{error}</p>}
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              activeSelectedPolicyId
                ? 'Ask a policy verification question...'
                : 'Select a policy ID before chatting'
            }
            disabled={!activeSelectedPolicyId || loading}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!activeSelectedPolicyId || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
