import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsDrawer } from './components/SettingsDrawer';
import { Toolbar } from './components/Toolbar';
import { EmptyState } from './components/EmptyState';
import { useChatFixed as useChat } from './hooks/useChat-fixed';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { ChatSettings } from './lib/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from './lib/constants';

function App() {
  const [settings, setSettings] = useLocalStorage<ChatSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentConversation,
    isStreaming,
    error,
    setError,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage,
    stopGeneration,
  } = useChat();

  // Aplicar tema
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
  }, [settings.theme]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  // Mostrar errores
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, settings);
  };

  const handleUpdateSettings = (newSettings: ChatSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  const handleToggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleNewConversation = () => {
    createNewConversation();
  };

  const isConfigured = settings.apiBaseUrl.trim() !== '';

  return (
    <div className={clsx(
      'min-h-screen transition-colors duration-200',
      'bg-gray-50 dark:bg-gray-950'
    )}>
      {/* Error Toast */}
      {showError && error && (
        <div className="fixed top-4 right-4 z-50 animate-slide-up">
          <div className="bg-error-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setShowError(false)}
              className="ml-2 hover:bg-error-700 rounded p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <Toolbar
          currentConversation={currentConversation}
          onNewConversation={handleNewConversation}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onUpdateTitle={updateConversationTitle}
          onDeleteConversation={deleteConversation}
          settings={settings}
          onToggleTheme={handleToggleTheme}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentConversation ? (
            <EmptyState onOpenSettings={() => setIsSettingsOpen(true)} />
          ) : currentConversation.messages.length === 0 ? (
            <EmptyState onOpenSettings={() => setIsSettingsOpen(true)} />
          ) : (
            <div className="space-y-1">
              {currentConversation.messages
                .filter(msg => msg.role !== 'system')
                .map((message, index) => (
                  <ChatMessage
                    key={`${message.timestamp || index}`}
                    message={message}
                    isStreaming={
                      isStreaming && 
                      index === currentConversation.messages.filter(m => m.role !== 'system').length - 1 &&
                      message.role === 'assistant'
                    }
                  />
                ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={stopGeneration}
          isStreaming={isStreaming}
          disabled={!isConfigured}
        />
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}

export default App;