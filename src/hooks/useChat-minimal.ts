import { useState, useCallback } from 'react';
import type { Message, Conversation, ChatSettings } from '../lib/types';

export function useChatMinimal() {
  console.log('🔥 useChatMinimal: Hook initializing');
  
  // Use simple state instead of localStorage for testing
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  console.log('🔍 useChatMinimal: Current state:', { 
    conversationsLength: conversations.length,
    currentConversationId, 
    hasCurrentConversation: !!currentConversation,
    isStreaming 
  });

  const createNewConversation = useCallback(() => {
    console.log('🚀 createNewConversation: Creating new conversation');
    const newConversation: Conversation = {
      id: 'test-conversation-' + Date.now(),
      title: 'Nueva conversación',
      createdAt: Date.now(),
      messages: [],
    };

    console.log('🚀 createNewConversation: Created conversation:', newConversation.id);
    setConversations([newConversation]);
    setCurrentConversationId(newConversation.id);
    setError(null);
    
    return newConversation;
  }, []);

  const sendMessage = useCallback(async (content: string, _settings: ChatSettings) => {
    console.log('🎯 sendMessage: ENTRY POINT - content:', content.slice(0, 50));
    console.log('🎯 sendMessage: Current state before:', { 
      conversationsLength: conversations.length, 
      currentConversationId, 
      isStreaming 
    });

    if (!content.trim()) {
      console.log('🎯 sendMessage: REJECTED - empty content');
      return;
    }

    if (isStreaming) {
      console.log('🎯 sendMessage: REJECTED - already streaming');
      return;
    }

    console.log('🎯 sendMessage: PROCEEDING with message');

    // Create conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId) {
      console.log('🎯 sendMessage: Creating new conversation');
      const newConv = createNewConversation();
      conversationId = newConv.id;
    }

    console.log('🎯 sendMessage: Using conversationId:', conversationId);

    // Create user message
    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    console.log('🎯 sendMessage: Adding user message');
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      );
      console.log('🎯 sendMessage: Conversations after user message:', updated.length);
      return updated;
    });

    // Create assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    console.log('🎯 sendMessage: Adding assistant message');
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, assistantMessage] }
          : conv
      );
      console.log('🎯 sendMessage: Conversations after assistant message:', updated.length);
      return updated;
    });

    setIsStreaming(true);
    console.log('🎯 sendMessage: Set streaming to true');

    // For now, just simulate a response
    setTimeout(() => {
      console.log('🎯 sendMessage: Simulating response update');
      setConversations(prev => {
        const updated = prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg, index) =>
                  index === conv.messages.length - 1 && msg.role === 'assistant'
                    ? { ...msg, content: '¡Hola! Esta es una respuesta de prueba.' }
                    : msg
                ),
              }
            : conv
        );
        console.log('🎯 sendMessage: Final conversations:', updated);
        return updated;
      });
      setIsStreaming(false);
    }, 1000);

  }, [conversations, currentConversationId, isStreaming, createNewConversation]);

  const stopGeneration = useCallback(() => {
    console.log('🛑 stopGeneration called');
    setIsStreaming(false);
  }, []);

  // Dummy functions for compatibility
  const updateConversationTitle = useCallback(() => {}, []);
  const deleteConversation = useCallback(() => {}, []);

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