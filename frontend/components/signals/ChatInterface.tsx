"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Role = "user" | "assistant";

interface AIMessageAction {
  type: "open_analysis" | "reset_context" | "confirm_query";
  label: string;
  analysis_id?: string;
}

interface QueryConfirmation {
  human_readable: string;
  logic_expression: string;
  estimated_count?: number | null;
}

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  actions?: AIMessageAction[];
  confirmation?: QueryConfirmation;
  requiresConfirmation?: boolean;
  refinementMode?: boolean; // Track if this was sent in refinement mode
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface ChatInterfaceProps {
  sessionId?: string; // Optional: if not provided, generates internally
  onQuerySubmit?: (query: string) => void; // Optional callback
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessionId: propSessionId,
  onQuerySubmit 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>(() => propSessionId || crypto.randomUUID());
  const [refinementMode, setRefinementMode] = useState<boolean>(true);
  const [shouldResetContext, setShouldResetContext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (propSessionId && propSessionId !== sessionId) {
      setSessionId(propSessionId);
    }
  }, [propSessionId, sessionId]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    addMessage(userMsg);
    setInput("");
    setIsLoading(true);

    const payload = {
      query: trimmed,
      session_id: sessionId,
      refinement_mode: refinementMode,
      reset_context: shouldResetContext,
      confirmed: false, // step 1: interpretation only
    };
    
    // Reset the flag after using it
    if (shouldResetContext) {
      setShouldResetContext(false);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ai/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Couldn't reach server. Please check your connection and try again.";
        try {
          const errText = await res.text();
          if (errText) {
            // Try to parse as JSON for structured errors
            try {
              const errJson = JSON.parse(errText);
              errorMessage = errJson.detail || errJson.message || errorMessage;
            } catch {
              // If not JSON, use the text if it's reasonable
              if (errText.length < 200) {
                errorMessage = `Error: ${errText}`;
              }
            }
          }
        } catch {
          // Keep default error message
        }
        
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: errorMessage,
        };
        addMessage(errMsg);
        return;
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.message,
        actions: data.actions || [],
        confirmation: data.confirmation
          ? {
              human_readable: data.confirmation.human_readable,
              logic_expression: data.confirmation.logic_expression,
              estimated_count: data.confirmation.estimated_count,
            }
          : undefined,
        requiresConfirmation: data.requires_confirmation || false,
        refinementMode: refinementMode, // Track if this was a refinement
      };

      addMessage(assistantMsg);
    } catch (error) {
      // Network errors (fetch failed)
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Couldn't reach server. Please check your connection and try again.",
      };
      addMessage(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    
    const payload = {
      query: "[CONFIRM]", // backend ignores query when confirmed=true
      session_id: sessionId,
      refinement_mode: refinementMode,
      reset_context: false,
      confirmed: true,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ai/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Couldn't reach server. Please check your connection and try again.";
        try {
          const errText = await res.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              errorMessage = errJson.detail || errJson.message || errorMessage;
            } catch {
              if (errText.length < 200) {
                errorMessage = `Error during confirmation: ${errText}`;
              }
            }
          }
        } catch {
          // Keep default error message
        }
        
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: errorMessage,
        };
        addMessage(errMsg);
        return;
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.message,
        actions: data.actions || [],
        confirmation: data.confirmation
          ? {
              human_readable: data.confirmation.human_readable,
              logic_expression: data.confirmation.logic_expression,
              estimated_count: data.confirmation.estimated_count,
            }
          : undefined,
        requiresConfirmation: data.requires_confirmation || false,
        refinementMode: refinementMode,
      };

      addMessage(assistantMsg);
    } catch (error) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Couldn't reach server. Please check your connection and try again.",
      };
      addMessage(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: AIMessageAction) => {
    if (action.type === "open_analysis" && action.analysis_id) {
      router.push(`/signals/analysis/${action.analysis_id}?session=${sessionId}`);
      return;
    }

    if (action.type === "confirm_query") {
      // Step 2: confirm and generate analysis handle
      void handleConfirm();
      return;
    }

    if (action.type === "reset_context") {
      setRefinementMode(false);
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Starting a fresh query. Your next question will not reuse previous filters.",
      };
      addMessage(msg);
      return;
    }
  };

  const handleResetContext = () => {
    setRefinementMode(false);
    setShouldResetContext(true);
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Starting a fresh query. Your next question will not reuse previous filters.",
    };
    addMessage(msg);
  };

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-white" style={{ height: '400px', maxHeight: '400px' }}>
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-gray-50 text-xs shrink-0">
        <span className="font-medium">Signal Assistant</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px]">
            <input
              type="checkbox"
              checked={refinementMode}
              onChange={(e) => setRefinementMode(e.target.checked)}
              className="h-3 w-3"
            />
            Refinement
          </label>
          <button
            className="text-[10px] px-1.5 py-0.5 border rounded hover:bg-gray-100"
            onClick={handleResetContext}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Messages area - fixed height with scroll */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs" style={{ maxHeight: 'calc(400px - 100px)' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-8">
            Ask me about cases, drugs, reactions, or time windows...
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] ${
                m.role === "user" ? "ml-auto text-right" : "mr-auto text-left"
              }`}
            >
              <div
                className={`inline-block px-2.5 py-1.5 rounded-lg text-xs ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.role === "assistant" && m.refinementMode && (
                  <div className="text-[9px] text-gray-500 italic mb-0.5">
                    (continuing from previous filters)
                  </div>
                )}
                <div className="break-words whitespace-pre-wrap">{m.text}</div>
              </div>

              {m.role === "assistant" && m.confirmation && (
                <div className="mt-1 text-[10px] text-gray-600 border-l-2 border-yellow-400 pl-1.5">
                  <div className="font-semibold">Filters:</div>
                  <div>{m.confirmation.human_readable}</div>
                  {typeof m.confirmation.estimated_count === "number" && (
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      ~{m.confirmation.estimated_count} cases
                    </div>
                  )}
                </div>
              )}

              {m.role === "assistant" && m.actions && m.actions.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {m.actions.map((a, idx) => (
                    <button
                      key={idx}
                      className="text-[10px] px-2 py-0.5 border rounded hover:bg-gray-100 bg-white"
                      onClick={() => handleAction(a)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t px-2.5 py-1.5 flex items-end gap-1.5 shrink-0 bg-white">
        <textarea
          className="flex-1 border rounded px-2 py-1 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-resize up to 2 lines (max ~40px)
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 40) + 'px';
          }}
          placeholder="Ask about cases..."
          disabled={isLoading}
          rows={1}
          style={{ maxHeight: '40px', minHeight: '28px' }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
};
