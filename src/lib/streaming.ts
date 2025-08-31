import type { ChatCompletionChunk, StreamingError } from './types';

export async function* parseSSEStream(
  response: Response
): AsyncGenerator<string, void, unknown> {
  if (!response.body) {
    throw new Error('Respuesta sin body para streaming');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          try {
            console.log('SSE Data:', data);
            const chunk: ChatCompletionChunk = JSON.parse(data);
            console.log('Parsed chunk:', chunk);
            const content = chunk.choices?.[0]?.delta?.content;
            console.log('Content:', content);
            if (content) {
              // Filter out thinking tags and their content
              const filteredContent = content.replace(/<think>[\s\S]*?<\/think>/g, '');
              if (filteredContent) {
                yield filteredContent;
              }
            }
            
            if (chunk.choices?.[0]?.finish_reason) {
              console.log('Stream finished:', chunk.choices?.[0]?.finish_reason);
              return;
            }
          } catch (error) {
            console.warn('Error parseando chunk SSE:', error, 'Data:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function createStreamingError(error: unknown): StreamingError {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return {
        message: 'Respuesta cancelada',
        type: 'abort',
      };
    }
    
    if (error.message.includes('fetch')) {
      return {
        message: 'Error de conexión. Verifica que LM Studio esté ejecutándose.',
        type: 'network',
      };
    }
  }

  return {
    message: 'Error desconocido durante el streaming',
    type: 'server',
  };
}

export function sanitizeMarkdown(content: string): string {
  // Remover posibles XSS básicos antes del marked
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}