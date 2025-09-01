import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import clsx from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onStopGeneration, 
  isStreaming, 
  disabled = false 
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [draft, setDraft] = useLocalStorage(STORAGE_KEYS.INPUT_DRAFT, '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar borrador al montar
  useEffect(() => {
    if (draft) {
      setInput(draft);
    }
  }, [draft]);

  // Guardar borrador mientras se escribe
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDraft(input);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input, setDraft]);

  // Auto-resize del textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;

    onSendMessage(input);
    setInput('');
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStop = () => {
    onStopGeneration();
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Generando respuesta..." : "Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"}
            disabled={isStreaming || disabled}
            className={clsx(
              "w-full resize-none rounded-xl border border-gray-300/50 dark:border-gray-600/50",
              "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 pr-12",
              "text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
              "transition-all duration-200 min-h-[48px] max-h-[120px] shadow-sm",
              (isStreaming || disabled) && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            className={clsx(
              "flex-shrink-0 p-3 rounded-xl shadow-lg",
              "bg-gradient-to-r from-error-600 to-error-700 hover:from-error-700 hover:to-error-800 text-white",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error-500/30 transform hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
            aria-label="Detener generación"
          >
            <Square className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={clsx(
              "flex-shrink-0 p-3 rounded-xl shadow-lg",
              "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transform hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
            aria-label="Enviar mensaje"
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </form>

      {disabled && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
          Configura la API en ajustes antes de comenzar
        </p>
      )}
    </div>
  );
}