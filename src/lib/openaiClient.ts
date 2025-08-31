import type { ChatCompletionRequest, ChatCompletionResponse } from './types';
import { parseSSEStream, createStreamingError } from './streaming';

interface ChatClientOptions {
  apiBaseUrl: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  useProxy?: boolean;
}

export class OpenAIClient {
  private baseUrl: string;
  private apiKey?: string;
  private useProxy: boolean;

  constructor(options: ChatClientOptions) {
    this.baseUrl = options.apiBaseUrl;
    this.apiKey = options.apiKey;
    this.useProxy = options.useProxy || false;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey && !this.useProxy) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private getEndpoint(): string {
    if (this.useProxy) {
      // Usar Firebase Function como proxy
      return `${window.location.origin}/api/chat`;
    }
    return `${this.baseUrl}/chat/completions`;
  }

  async *createChatCompletionStream(
    request: ChatCompletionRequest,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    try {
      const body = this.useProxy 
        ? { ...request, apiBaseUrl: this.baseUrl, apiKey: this.apiKey }
        : request;

      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error ${response.status}`;
        
        switch (response.status) {
          case 401:
            errorMessage = 'API Key inválida o faltante';
            break;
          case 404:
            errorMessage = 'Endpoint no encontrado. Verifica la URL base.';
            break;
          case 429:
            errorMessage = 'Límite de rate exceeded. Intenta más tarde.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error?.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
        }
        
        throw new Error(errorMessage);
      }

      if (request.stream) {
        yield* parseSSEStream(response);
      } else {
        const data: ChatCompletionResponse = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        yield content;
      }
    } catch (error) {
      const streamingError = createStreamingError(error);
      throw new Error(streamingError.message);
    }
  }

  async createChatCompletion(
    request: ChatCompletionRequest,
    signal?: AbortSignal
  ): Promise<string> {
    const nonStreamingRequest = { ...request, stream: false };
    
    for await (const chunk of this.createChatCompletionStream(nonStreamingRequest, signal)) {
      return chunk;
    }
    
    return '';
  }
}

export function createOpenAIClient(options: ChatClientOptions): OpenAIClient {
  return new OpenAIClient(options);
}