import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ThinkingSpinnerProps {
  isVisible: boolean;
}

export function ThinkingSpinner({ isVisible }: ThinkingSpinnerProps) {
  if (!isVisible) return null;

  return (
    <div className={clsx(
      'flex items-center space-x-3 p-4 animate-fade-in',
      'justify-start'
    )}>
      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
        <Loader2 className="h-4 w-4 text-primary-600 dark:text-primary-400 animate-spin" />
      </div>
      
      <div className="max-w-[70%] rounded-2xl px-4 py-3 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Pensando...</span>
        </div>
      </div>
    </div>
  );
}