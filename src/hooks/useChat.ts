import { useState, useCallback, useRef } from 'react';
import type { Message, Conversation, ChatSettings } from '../lib/types';
import { createOpenAIClient } from '../lib/openaiClient';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';

export function useChat() {
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

  console.log('useChat state:', { 
    conversations, 
    currentConversationId, 
    currentConversation 
  });

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nueva conversación',
      createdAt: Date.now(),
      messages: [],
    };

    console.log('createNewConversation: Creating conversation:', newConversation);
    setConversations(prev => {
      const updated = [newConversation, ...prev];
      console.log('createNewConversation: Updated conversations:', updated);
      return updated;
    });
    setCurrentConversationId(newConversation.id);
    setError(null);
    
    return newConversation;
  }, [setConversations, setCurrentConversationId]);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, title } : conv
      )
    );
  }, [setConversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter(c => c.id !== conversationId);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [conversations, currentConversationId, setConversations, setCurrentConversationId]);

  const addMessage = useCallback((conversationId: string, message: Message) => {
    console.log('addMessage called with:', { conversationId, message });
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, { ...message, timestamp: Date.now() }] }
          : conv
      );
      console.log('Conversations after addMessage:', updated);
      return updated;
    });
  }, [setConversations]);

  const updateLastMessage = useCallback((conversationId: string, content: string) => {
    console.log('updateLastMessage called with:', { conversationId, content });
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map((msg, index) =>
                index === conv.messages.length - 1 ? { ...msg, content } : msg
              ),
            }
          : conv
      );
      console.log('Updated conversations:', updated);
      return updated;
    });
  }, [setConversations]);

  const sendMessage = useCallback(async (
    content: string,
    settings: ChatSettings
  ) => {
    if (!content.trim() || isStreaming) return;

    let conversationId = currentConversationId;
    
    if (!conversationId) {
      console.log('No conversationId, creating new conversation');
      const newConv = createNewConversation();
      conversationId = newConv.id;
      console.log('Created new conversation with ID:', conversationId);
    } else {
      console.log('Using existing conversationId:', conversationId);
    }

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
    };

    addMessage(conversationId, userMessage);
    setError(null);
    setIsStreaming(true);

    // Crear mensaje del asistente vacío
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
    };
    console.log('Adding initial assistant message:', assistantMessage);
    addMessage(conversationId, assistantMessage);

    // Actualizar título si es el primer mensaje
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation && conversation.messages.length <= 1) {
      const title = content.length > 50 ? content.slice(0, 50) + '...' : content;
      updateConversationTitle(conversationId, title);
    }

    try {
      const client = createOpenAIClient({
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        useProxy: settings.useProxy,
      });

      // Preparar mensajes para la API
      const messages: Message[] = [];
      
      if (settings.systemPrompt) {
        messages.push({
          role: 'system',
          content: settings.systemPrompt,
        });
      }

      // Añadir historial de la conversación
      const currentConv = conversations.find(c => c.id === conversationId);
      if (currentConv) {
        messages.push(...currentConv.messages.filter(m => m.role !== 'system'));
      }

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
        console.log('Received chunk:', chunk);
        assistantContent += chunk;
        console.log('Assistant content so far:', assistantContent);
        
        // Filter out thinking tags from the complete content
        const filteredContent = assistantContent.replace(/<think>[\s\S]*?<\/think>/g, '');
        console.log('Filtered content:', filteredContent);
        
        updateLastMessage(conversationId, filteredContent);
      }

    } catch (error) {
      console.error('Error en chat:', error);
      
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Respuesta cancelada';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Remover el mensaje vacío del asistente en caso de error
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
  }, [
    currentConversationId,
    isStreaming,
    conversations,
    createNewConversation,
    addMessage,
    updateLastMessage,
    updateConversationTitle,
    setConversations,
  ]);

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