import { useState } from 'react';
import { Plus, Settings, Sun, Moon, Trash2, Edit3, Check, X } from 'lucide-react';
import type { Conversation, ChatSettings } from '../lib/types';

interface ToolbarProps {
  currentConversation: Conversation | undefined;
  onNewConversation: () => void;
  onOpenSettings: () => void;
  onUpdateTitle: (conversationId: string, title: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  settings: ChatSettings;
  onToggleTheme: () => void;
}

export function Toolbar({
  currentConversation,
  onNewConversation,
  onOpenSettings,
  onUpdateTitle,
  onDeleteConversation,
  settings,
  onToggleTheme,
}: ToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = () => {
    if (currentConversation) {
      setEditTitle(currentConversation.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (currentConversation && editTitle.trim()) {
      onUpdateTitle(currentConversation.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {currentConversation && (
            <>
              {isEditingTitle ? (
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveTitle}
                    autoFocus
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/10 rounded transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {currentConversation.title}
                  </h1>
                  <button
                    onClick={handleStartEdit}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Cambiar tema"
          >
            {settings.theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {currentConversation && (
            <button
              onClick={() => onDeleteConversation(currentConversation.id)}
              className="p-2 text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/10 rounded-lg transition-colors"
              aria-label="Eliminar conversación"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={onNewConversation}
            className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-colors"
            aria-label="Nueva conversación"
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Configuración"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}