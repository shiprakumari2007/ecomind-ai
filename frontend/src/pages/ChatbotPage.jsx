import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Trash2,
  HelpCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_SUGGESTIONS = [
  'Why was my electricity consumption high yesterday?',
  'Which department wastes the most energy?',
  'How can I reduce my electricity bill?',
  'What is my predicted consumption next month?',
  'Which appliance should I optimize first?',
  'How can I reduce my carbon footprint?',
];

export default function ChatbotPage() {
  const { isDark } = useTheme();
  const { showNotification } = useApp();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [activeModel, setActiveModel] = useState('EcoMind Grounded Intelligence');
  const chatEndRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const history = await api.getChatHistory('default');
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Welcome message
        setMessages([
          {
            role: 'assistant',
            message:
              "Hello! I am **EcoBot**, your intelligent AI Energy & Sustainability Copilot. " +
              "I am connected to your live facility energy telemetry, anomaly reports, and time-series models.\n\n" +
              "You can ask me questions about yesterday's spikes, departmental wastage, predicted electricity bills, " +
              "or click any of the suggested prompts below to start exploring!",
            model_used: 'EcoMind Engine',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      message: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(textToSend, 'default');
      const botMsg = {
        role: 'assistant',
        message: res.answer,
        model_used: res.model_used,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (res.model_used) setActiveModel(res.model_used);
      if (res.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestions(res.suggested_questions);
      }
    } catch (err) {
      showNotification(err.message || 'Error communicating with EcoBot.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory('default');
      setMessages([]);
      setSuggestions(DEFAULT_SUGGESTIONS);
      showNotification('Chat history cleared.', 'success');
      fetchHistory();
    } catch (err) {
      showNotification('Failed to clear history.', 'error');
    }
  };

  const renderMarkdown = (text) => {
    // Clean formatted rendering for markdown highlights and bold text
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-emerald-300 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200">
            {formatBold(line.substring(2))}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="ml-2 font-medium text-slate-200 my-0.5">
            {formatBold(line)}
          </div>
        );
      }
      return (
        <p key={idx} className="my-1 text-slate-200 leading-relaxed">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header bar */}
      <div className="p-4 rounded-2xl border border-slate-500/10 backdrop-blur-xl bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">EcoBot Sustainability Assistant</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                Data-Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Active Engine: {activeModel}</p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          title="Clear Conversation History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Body */}
      <div
        className={`flex-1 overflow-y-auto p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        } space-y-4`}
      >
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div key={i} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-teal-600 text-white'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : isDark
                    ? 'bg-slate-800/80 border border-slate-700/60 text-slate-100 rounded-tl-xs shadow-md'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs shadow-xs'
                }`}
              >
                {renderMarkdown(m.message)}

                {!isUser && m.model_used && (
                  <div className="mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Grounded in live telemetry • {m.model_used}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 rounded-tl-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Analyzing live telemetry metrics & model forecasts...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Follow-Up Prompts */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-slate-400 px-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-emerald-400" />
          Suggested Explorations:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-emerald-500/15 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition-all text-left flex items-center gap-1.5"
            >
              <span>{s}</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask EcoBot anything about your facility's energy, anomalies, or carbon footprint..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-2xl text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
