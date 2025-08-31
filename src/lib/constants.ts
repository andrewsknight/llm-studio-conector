export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'http://localhost:1234/v1',
  apiKey: '',
  model: 'lmstudio-community/Meta-Llama-3-8B-Instruct',
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: 'Eres un asistente útil y amigable. Responde de manera clara y concisa.',
  theme: 'dark' as const,
  useProxy: false,
};

export const STORAGE_KEYS = {
  CONVERSATIONS: 'llm-chat-conversations',
  SETTINGS: 'llm-chat-settings',
  CURRENT_CONVERSATION: 'llm-chat-current',
  INPUT_DRAFT: 'llm-chat-input-draft',
} as const;

export const TEMPERATURE_MARKS = [
  { value: 0, label: '0' },
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
];

export const MAX_TOKENS_OPTIONS = [
  { value: 256, label: '256' },
  { value: 512, label: '512' },
  { value: 1024, label: '1024' },
  { value: 2048, label: '2048' },
  { value: 4096, label: '4096' },
];