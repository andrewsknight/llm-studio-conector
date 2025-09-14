import { useState, useCallback, useRef } from 'react';
import type { Message, Conversation, ChatSettings } from '../lib/types';
import { createOpenAIClient } from '../lib/openaiClient';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';

export function useChatDebug() {
  console.log('🚀 useChatDebug: Hook initializing');
  
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(
    STORAGE_KEYS.CONVERSATIONS,
    []
  );
  
  const [currentConversationId, setCurrentConversationId] = useLocalStorage<string | null>(
    STORAGE_KEYS.CURRENT_CONVERSATION,
    null
  );
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  console.log('🔍 useChatDebug: Current state:', { 
    conversationsLength: conversations.length,
    currentConversationId, 
    currentConversation: currentConversation ? 'found' : 'not found',
    isStreaming 
  });

  const createNewConversation = useCallback(() => {
    console.log('📝 createNewConversation: Starting');
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nueva conversación',
      createdAt: Date.now(),
      messages: [],
    };

    console.log('📝 createNewConversation: Created:', newConversation);
    
    // Direct state update to test
    setConversations([newConversation]);
    setCurrentConversationId(newConversation.id);
    setError(null);
    
    console.log('📝 createNewConversation: State updated');
    return newConversation;
  }, [setConversations, setCurrentConversationId]);

  const sendMessage = useCallback(async (
    content: string,
    settings: ChatSettings
  ) => {
    console.log('📨 sendMessage: Starting with content:', content);
    
    if (!content.trim() || isStreaming) {
      console.log('📨 sendMessage: Rejected - empty content or already streaming');
      return;
    }

    let conversationId = currentConversationId;
    
    if (!conversationId) {
      console.log('📨 sendMessage: No conversation, creating new one');
      const newConv = createNewConversation();
      conversationId = newConv.id;
    }

    console.log('📨 sendMessage: Using conversationId:', conversationId);

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    console.log('📨 sendMessage: Adding user message:', userMessage);
    
    // Add user message directly to test
    setConversations(prev => {
      console.log('📨 setConversations: Previous conversations:', prev);
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      );
      console.log('📨 setConversations: Updated conversations:', updated);
      return updated;
    });

    setError(null);
    setIsStreaming(true);

    // Create assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    console.log('📨 sendMessage: Adding assistant message:', assistantMessage);
    
    // Add assistant message directly to test
    setConversations(prev => {
      console.log('📨 setConversations (assistant): Previous conversations:', prev);
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, assistantMessage] }
          : conv
      );
      console.log('📨 setConversations (assistant): Updated conversations:', updated);
      return updated;
    });

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

      messages.push(userMessage);

      abortControllerRef.current = new AbortController();
      let assistantContent = '';
      
      console.log('📡 sendMessage: Starting stream...');
      
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
        
        console.log('📡 sendMessage: Updating with filtered content:', filteredContent.slice(0, 50) + '...');
        
        // Update last message directly
        setConversations(prev => {
          console.log('📡 setConversations (update): Previous conversations:', prev.length);
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
          console.log('📡 setConversations (update): Updated conversations:', updated.length);
          return updated;
        });
      }

    } catch (error) {
      console.error('💥 sendMessage: Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [currentConversationId, isStreaming, createNewConversation, setConversations]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    console.log('📝 updateConversationTitle:', conversationId, title);
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    console.log('🗑️ deleteConversation:', conversationId);
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
    sendMessage,
    stopGeneration,
  };
}