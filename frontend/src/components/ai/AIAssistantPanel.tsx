import React, { useState } from 'react';
import { Bot, Send, Shield, X, RefreshCw, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  suggestions?: string[];
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetContext?: string;
  initialQuery?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  targetContext,
  initialQuery
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello, I am CyberEye Defensive Intelligence Advisor. ${
        targetContext ? `I am currently analyzing findings for **${targetContext}**.` : 'How can I assist your defensive investigation today?'
      }\n\nAsk me to interpret findings, demystify CVEs, evaluate risk factors, or prioritize remediation actions.`,
      source: 'CyberEye Defensive Intelligence Model',
      suggestions: [
        'What does this finding indicate?',
        'Why is this asset considered high risk?',
        'What should a defender investigate next?',
        'Explain this CVE in simple terms.'
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || isLoading) return;

    const newMsgs: Message[] = [...messages, { sender: 'user', text: q }];
    setMessages(newMsgs);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.aiAnalyze(q, targetContext);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: res.response,
          source: res.source,
          suggestions: res.suggestions
        }
      ]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: `Error contacting intelligence engine: ${err.message || 'Service unavailable'}. Please verify backend status.`,
          source: 'System Error Fallback'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 md:w-[420px] bg-[#0c0e16] border-l border-slate-800 z-50 flex flex-col shadow-2xl select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0f121d]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              CYBEREYE DEFENSIVE ADVISOR
              <span className="text-[9px] px-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/60">
                DEFENSIVE
              </span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {targetContext ? `Context: ${targetContext}` : 'Global Intelligence Telemetry'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Defensive Ethics Notice */}
      <div className="px-3.5 py-1.5 bg-[#0e111a] border-b border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>Strictly operates within defensive boundaries. No exploit synthesis.</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded text-xs font-sans leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-900/40 text-slate-100 border border-blue-800/80 rounded-br-none'
                  : 'matte-panel text-slate-200 border-slate-800 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {m.source && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{m.source}</span>
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            {m.suggestions && m.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                {m.suggestions.map((s, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSend(s)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-slate-100 transition-colors text-left flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 p-2.5 rounded matte-panel max-w-[70%]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Analyzing correlated intelligence...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-[#0e111a]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask defensive advisor about indicators or triage..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="p-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
