import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize2, Maximize2, X } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
  suggestions?: string[];
}

interface ChatInterfaceProps {
  onQuerySubmit?: (query: string) => void;
}

export function ChatInterface({ onQuerySubmit }: ChatInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Hi! I can help you analyze your pharmacovigilance data. Try asking:",
      timestamp: new Date(),
      suggestions: [
        "How many serious events?",
        "Show me Aspirin cases",
        "What's trending?",
        "Are there any signals for Lipitor?"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI query API
      const response = await fetch('/api/v1/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue })
      });

      const data = await response.json();

      const aiMessage: Message = {
        role: 'ai',
        content: data.answer || 'I encountered an error processing your request.',
        timestamp: new Date(),
        data: data.data,
        suggestions: data.follow_up_suggestions
      };

      setMessages(prev => [...prev, aiMessage]);

      // Notify parent component
      if (onQuerySubmit) {
        onQuerySubmit(inputValue);
      }
    } catch (error) {
      console.error('Error querying AI:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    if (isExpanded) {
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 transition-all duration-300 z-50 ${
        isExpanded ? 'h-[500px]' : 'h-16'
      }`}
      style={{ marginLeft: '250px' }} // Account for sidebar
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-3 border-b border-slate-700 cursor-pointer hover:bg-slate-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-semibold text-slate-200">💬 AI Investigation</span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <Minimize2 className="w-5 h-5 text-slate-400 hover:text-slate-200" />
          ) : (
            <Maximize2 className="w-5 h-5 text-slate-400 hover:text-slate-200" />
          )}
        </div>
      </div>

      {/* Messages Area */}
      {isExpanded && (
        <div className="h-[calc(100%-120px)] overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Data visualization if present */}
                {message.data && (
                  <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600 text-sm">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-slate-400">Try asking:</div>
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-400 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      {isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your data... (e.g., 'Show me Aspirin cases')"
              className="flex-1 px-4 py-3 bg-slate-700 text-slate-200 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Collapsed state - just show input */}
      {!isExpanded && (
        <div className="px-6 flex items-center h-full">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Ask about your data... (click to expand)"
            className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-slate-400"
          />
        </div>
      )}
    </div>
  );
}
