import { useState, Fragment } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { User, Bot } from 'lucide-react';
import clsx from 'clsx';
import type { Message } from '../lib/types';
import { sanitizeMarkdown } from '../lib/streaming';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Error copiando código:', error);
    }
  };

  const formatContent = (content: string) => {
    if (isUser) {
      return content.split('\n').map((line, index) => (
        <Fragment key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </Fragment>
      ));
    }

    try {
      const sanitizedContent = sanitizeMarkdown(content);
      const htmlContent = marked(sanitizedContent, {
        gfm: true,
        breaks: true,
      });
      
      const cleanHTML = DOMPurify.sanitize(htmlContent as string, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
        ALLOWED_ATTR: ['class'],
      });

      // Post-procesar para añadir botones de copia a bloques de código
      const processedHTML = cleanHTML.replace(
        /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
        (_, code) => {
          const decodedCode = code
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"');
          
          const codeId = Math.random().toString(36).substr(2, 9);
          
          return `
            <div class="relative group">
              <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>${code}</code></pre>
              <button 
                class="copy-btn absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100" 
                data-code="${encodeURIComponent(decodedCode)}"
                data-id="${codeId}"
              >
                ${copiedCode === codeId ? 
                  '<svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' :
                  '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>'
                }
              </button>
            </div>
          `;
        }
      );

      return (
        <div 
          dangerouslySetInnerHTML={{ __html: processedHTML }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('copy-btn') || target.closest('.copy-btn')) {
              const button = target.closest('.copy-btn') as HTMLButtonElement;
              const code = decodeURIComponent(button.dataset.code || '');
              const id = button.dataset.id || '';
              handleCopyCode(code, id);
            }
          }}
          className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:m-0"
        />
      );
    } catch (error) {
      console.error('Error procesando markdown:', error);
      return <span className="text-red-500">Error procesando mensaje</span>;
    }
  };

  if (isSystem) return null;

  return (
    <div
      className={clsx(
        'flex items-start space-x-3 p-4 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
      )}
      
      <div
        className={clsx(
          'max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-primary-600 text-white ml-auto'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
        )}
      >
        <div className={clsx(
          'text-sm leading-relaxed',
          isStreaming && 'animate-pulse-soft'
        )}>
          {formatContent(message.content)}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
}