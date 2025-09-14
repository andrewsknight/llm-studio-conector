import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Conversation, ChatSettings } from '../lib/types';
import { createOpenAIClient } from '../lib/openaiClient';
import { STORAGE_KEYS } from '../lib/constants';

// Simple localStorage helpers
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export function useChatFinal() {
  console.log('🚀 useChatFinal: Hook initializing');
  
  // Load initial state from localStorage
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.CONVERSATIONS, []);
    console.log('🚀 useChatFinal: Loaded conversations from localStorage:', loaded.length);
    return loaded;
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.CURRENT_CONVERSATION, null);
    console.log('🚀 useChatFinal: Loaded currentConversationId from localStorage:', loaded);
    return loaded;
  });
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  
  console.log('🔍 useChatFinal: Current state:', {
    conversationsCount: conversations.length,
    currentConversationId,
    hasCurrentConversation: !!currentConversation,
    currentConversationMessages: currentConversation?.messages.length || 0,
    isStreaming,
  });

  // Use refs for stable references
  const conversationsRef = useRef(conversations);
  const currentConversationIdRef = useRef(currentConversationId);
  const isStreamingRef = useRef(isStreaming);
  
  // Update refs when state changes
  conversationsRef.current = conversations;
  currentConversationIdRef.current = currentConversationId;
  isStreamingRef.current = isStreaming;
  
  // Save to localStorage whenever state changes (with refs to avoid infinite loops)
  useEffect(() => {
    console.log('💾 useChatFinal: Saving conversations to localStorage:', conversations.length);
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversations);
  }, [conversations]);

  useEffect(() => {
    console.log('💾 useChatFinal: Saving currentConversationId to localStorage:', currentConversationId);
    saveToStorage(STORAGE_KEYS.CURRENT_CONVERSATION, currentConversationId);
  }, [currentConversationId]);

  const createNewConversation = useCallback(() => {
    console.log('📝 useChatFinal: createNewConversation called');
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nueva conversación',
      createdAt: Date.now(),
      messages: [],
    };

    console.log('📝 useChatFinal: Created new conversation:', newConversation.id);
    setConversations(prev => {
      const updated = [newConversation, ...prev];
      console.log('📝 useChatFinal: Updated conversations list:', updated.length);
      return updated;
    });
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
    
    if (currentConversationIdRef.current === conversationId) {
      const remaining = conversationsRef.current.filter(c => c.id !== conversationId);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    settings: ChatSettings
  ) => {
    console.log('📨 useChatFinal: sendMessage called with content:', content.slice(0, 50) + '...');
    console.log('📨 useChatFinal: Current state (via refs):', { 
      conversationsCount: conversationsRef.current.length, 
      currentConversationId: currentConversationIdRef.current, 
      isStreaming: isStreamingRef.current 
    });

    if (!content.trim()) {
      console.log('📨 useChatFinal: Rejected - empty content');
      return;
    }

    if (isStreamingRef.current) {
      console.log('📨 useChatFinal: Rejected - already streaming');
      return;
    }

    let conversationId = currentConversationIdRef.current;
    
    if (!conversationId) {
      console.log('📨 useChatFinal: No conversation, creating new one');
      const newConv = createNewConversation();
      conversationId = newConv.id;
      console.log('📨 useChatFinal: Using new conversation ID:', conversationId);
    } else {
      console.log('📨 useChatFinal: Using existing conversation ID:', conversationId);
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

    // Add both messages at once
    console.log('📨 useChatFinal: Adding user and assistant messages');
    setConversations(prev => {
      console.log('📨 useChatFinal: Previous conversations:', prev.length);
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, userMessage, assistantMessage] }
          : conv
      );
      console.log('📨 useChatFinal: Updated conversations after adding messages:', updated.length);
      console.log('📨 useChatFinal: Target conversation messages:', updated.find(c => c.id === conversationId)?.messages.length);
      return updated;
    });

    // Update title if first message
    if (conversationsRef.current.find(c => c.id === conversationId)?.messages.length === 0) {
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

      // Add conversation history
      const currentConv = conversationsRef.current.find(c => c.id === conversationId);
      if (currentConv) {
        messages.push(...currentConv.messages.filter(m => m.role !== 'system'));
      }
      messages.push(userMessage); // Add current user message

      abortControllerRef.current = new AbortController();
      let assistantContent = '';
      
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
        
        // Filter out thinking tags from the complete content
        const filteredContent = assistantContent.replace(/<think>[\s\S]*?<\/think>/g, '');
        
        // Update the last assistant message
        console.log('📡 useChatFinal: Updating assistant message with content:', filteredContent.slice(0, 50) + '...');
        setConversations(prev => {
          const updated = prev.map(conv =>
            conv.id === conversationId
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
          console.log('📡 useChatFinal: Updated conversations after content update');
          return updated;
        });
      }

    } catch (error) {
      console.error('Error in chat:', error);
      
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
          conv.id === conversationId
            ? { ...conv, messages: conv.messages.slice(0, -1) }
            : conv
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [createNewConversation, updateConversationTitle]);

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