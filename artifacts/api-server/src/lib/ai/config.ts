export interface GeminiOperationConfig {
  provider: 'gemini';
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface WhisperOperationConfig {
  provider: 'whisper';
  model: string;
  language: string;
}

export type OperationConfig = GeminiOperationConfig | WhisperOperationConfig;

export function isGeminiConfig(c: OperationConfig): c is GeminiOperationConfig {
  return c.provider === 'gemini';
}

export function isWhisperConfig(c: OperationConfig): c is WhisperOperationConfig {
  return c.provider === 'whisper';
}

export const OPERATION_CONFIG: Record<string, OperationConfig> = {
  chat: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxOutputTokens: 4000,
  },
  'chat:lead-analysis': {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.5,
    maxOutputTokens: 500,
  },
  'chat:prospectar': {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.9,
    maxOutputTokens: 2000,
  },
  'marketing:generate': {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    maxOutputTokens: 2000,
  },
  approach: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.85,
    maxOutputTokens: 200,
  },
  transcribe: {
    provider: 'whisper',
    model: 'whisper-1',
    language: 'pt',
  },
};
