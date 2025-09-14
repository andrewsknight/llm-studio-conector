import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Conversation, ChatSettings } from '../lib/types';
import { createOpenAIClient } from '../lib/openaiClient';
import { STORAGE_KEYS } from '../lib/constants';

// Robust thinking tag filter
function filterThinkingTags(content: string): string {
  if (!content) return '';
  
  let filtered = content;
  
  // Remove complete <think>...</think> blocks
  filtered = filtered.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Handle streaming - remove everything from <think> to end if no closing tag yet
  if (filtered.includes('<think>') && !filtered.includes('</think>')) {
    filtered = filtered.substring(0, filtered.indexOf('<think>'));
  }
  
  // Handle case where </think> appears before content (shouldn't happen but just in case)
  if (filtered.includes('</think>')) {
    const lastThinkClose = filtered.lastIndexOf('</think>');
    filtered = filtered.substring(lastThinkClose + 8);
  }
  
  // Clean up whitespace and newlines
  filtered = filtered.trim();
  
  // Remove leading/trailing newlines
  filtered = filtered.replace(/^\n+|\n+$/g, '');
  
  return filtered;
}

export function useChatFixed() {
  // Simple state - no localStorage complications initially
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // Load from localStorage on mount only
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const savedCurrentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
      
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations);
        if (Array.isArray(parsed)) {
          setConversations(parsed);
        }
      }
      
      if (savedCurrentId) {
        const parsed = JSON.parse(savedCurrentId);
        if (typeof parsed === 'string') {
          setCurrentConversationId(parsed);
        }
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, JSON.stringify(currentConversationId));
    } catch (error) {
      console.error('Error saving current conversation ID:', error);
    }
  }, [currentConversationId]);

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nueva conversación',
      createdAt: Date.now(),
      messages: [],
    };

    console.log('✅ Creating new conversation:', newConversation.id);
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setError(null);
    
    return newConversation;
  }, []);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, title } : conv
      )
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // If deleting current conversation, switch to first remaining one
    setCurrentConversationId(prevId => {
      if (prevId === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prevId;
    });
  }, [conversations]);

  const sendMessage = useCallback(async (
    content: string,
    settings: ChatSettings
  ) => {
    if (!content.trim() || isStreaming) return;

    console.log('🚀 Sending message:', content);

    // Always create new conversation if none exists
    let conversationId = currentConversationId;
    let targetConversation = conversations.find(c => c.id === conversationId);
    
    if (!targetConversation) {
      console.log('📝 No valid conversation found, creating new one');
      const newConv = createNewConversation();
      conversationId = newConv.id;
      targetConversation = newConv;
    }

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Add messages
    console.log('📨 Adding user and assistant messages');
    setConversations(prev => {
      return prev.map(conv =>
        conv.id === conversationId!
          ? { ...conv, messages: [...conv.messages, userMessage, assistantMessage] }
          : conv
      );
    });

    // Update title if first message
    if (targetConversation.messages.length === 0) {
      const title = content.length > 50 ? content.slice(0, 50) + '...' : content;
      setTimeout(() => updateConversationTitle(conversationId!, title), 100);
    }

    setError(null);
    setIsStreaming(true);

    try {
      const client = createOpenAIClient({
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        useProxy: settings.useProxy,
      });

      const messages: Message[] = [];
      
      if (settings.systemPrompt) {
        messages.push({
          role: 'system',
          content: settings.systemPrompt,
        });
      }

      // Add current conversation messages + new user message
      messages.push(...targetConversation.messages.filter(m => m.role !== 'system'));
      messages.push(userMessage);

      abortControllerRef.current = new AbortController();
      let assistantContent = '';
      
      console.log('📡 Starting streaming...');
      
      for await (const chunk of client.createChatCompletionStream(
        {
          model: settings.model,
          messages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        },
        abortControllerRef.current.signal
      )) {
        assistantContent += chunk;
        
        // Filter out thinking tags using the robust filter
        const filteredContent = filterThinkingTags(assistantContent);
        
        // Debug logging to verify filtering
        if (assistantContent.includes('<think>') || assistantContent.includes('</think>')) {
          console.log('🧠 Filtering thinking content:');
          console.log('  Original length:', assistantContent.length);
          console.log('  Filtered length:', filteredContent.length);
          console.log('  Filtered preview:', filteredContent.slice(0, 100) + (filteredContent.length > 100 ? '...' : ''));
        }
        
        // Update the last assistant message
        setConversations(prev => {
          return prev.map(conv =>
            conv.id === conversationId!
              ? {
                  ...conv,
                  messages: conv.messages.map((msg, index) =>
                    index === conv.messages.length - 1 && msg.role === 'assistant'
                      ? { ...msg, content: filteredContent }
                      : msg
                  ),
                }
              : conv
          );
        });
      }

      console.log('✅ Streaming completed');

    } catch (error) {
      console.error('❌ Error during streaming:', error);
      
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Respuesta cancelada';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Remove empty assistant message on error
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId!
            ? { ...conv, messages: conv.messages.slice(0, -1) }
            : conv
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [currentConversationId, conversations, isStreaming, createNewConversation, updateConversationTitle]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    isStreaming,
    error,
    setError,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    setCurrentConversationId,
    sendMessage,
    stopGeneration,
  };
}