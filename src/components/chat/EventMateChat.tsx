import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  User,
  Bot,
  RotateCw,
  Copy,
  Check,
  Calendar,
  Wallet,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useEvent } from "../../context/EventContext.tsx";
import { useAuth } from "../../context/AuthContext.tsx";
import { api } from "../../services/api.ts";

interface EventMateChatProps {
  isOpen: boolean;
  onClose: () => void;
  isFloating?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "How can I save 20% on catering without compromising quality?",
  "Suggest 4 unique grand entry ideas for 150 guests",
  "Help me structure a 4-hour evening celebration timeline",
  "Draft a warm, polite WhatsApp RSVP follow-up message",
  "Recommend vendor questions before signing a banquet hall contract",
];

export const EventMateChat: React.FC<EventMateChatProps> = ({
  isOpen,
  onClose,
  isFloating = true,
}) => {
  const { activeEvent } = useEvent();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm **EventMate AI**, your personal celebration architect. ${
        activeEvent
          ? `I'm fully synced with **"${activeEvent.name}"** (${activeEvent.guestCount} guests, ₹${activeEvent.totalBudget.toLocaleString()} budget). Ask me anything about decor concepts, budget optimization, vendor negotiations, or countdown schedules!`
          : "I can help you plan weddings, birthdays, corporate celebrations, college festivals, and more. What are you looking to plan today?"
      }`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const newMsg: Message = {
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.chatWithAi({
        message: userText,
        eventId: activeEvent?.id,
        history: historyPayload,
      });

      const aiMsg: Message = {
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an issue: ${err?.message || "Please check your network or try again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div
      className={
        isFloating
          ? "fixed bottom-5 right-5 z-50 w-full sm:w-[450px] max-w-[95vw] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-purple-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5"
          : "w-full max-w-4xl mx-auto h-[680px] bg-white rounded-3xl shadow-xl border border-purple-100 flex flex-col overflow-hidden"
      }
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6C4AB6] via-[#7B52CE] to-pink-500 text-white p-4 px-5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-200 shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                EventMate AI
              </h3>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-[9px] font-bold text-gray-900">
                Online
              </span>
            </div>
            <p className="text-[11px] text-purple-100 truncate max-w-[240px]">
              {activeEvent ? `Context: ${activeEvent.name}` : "General Celebration Advice"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Event Context Pill Bar */}
      {activeEvent && (
        <div className="bg-purple-50/80 px-4 py-2 border-b border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-semibold shrink-0">
          <span className="flex items-center gap-1 truncate">
            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">{activeEvent.name}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0 text-[#6C4AB6]">
            <Wallet className="w-3.5 h-3.5" />
            <span>₹{activeEvent.totalBudget.toLocaleString()}</span>
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isUser
                    ? "bg-[#6C4AB6] text-white"
                    : "bg-gradient-to-tr from-purple-100 to-pink-100 text-[#6C4AB6] border border-purple-200"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 space-y-1 relative group ${
                  isUser
                    ? "bg-[#6C4AB6] text-white rounded-tr-xs shadow-xs"
                    : "bg-gray-50 text-gray-800 rounded-tl-xs border border-gray-100 leading-relaxed shadow-2xs"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {m.content}
                </div>
                <div
                  className={`text-[9px] flex items-center justify-between pt-1 ${
                    isUser ? "text-purple-200" : "text-gray-400"
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(m.content, idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:text-purple-600"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-purple-600 bg-purple-50/60 p-3 rounded-2xl w-fit">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span className="font-semibold">EventMate AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            💡 {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-gray-100 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask EventMate AI anything about your celebration..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#6C4AB6] bg-gray-50 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-[#6C4AB6] hover:bg-[#58399e] disabled:bg-gray-200 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
