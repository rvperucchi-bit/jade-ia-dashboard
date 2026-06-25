// ── OpenAI Chat / Generate ──────────────────────────────────────────────────
export interface OpenAIOperationConfig {
  provider: 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
}

// ── OpenAI Embeddings ───────────────────────────────────────────────────────
export interface OpenAIEmbeddingConfig {
  provider: 'openai-embedding';
  model: string;
}

// ── Whisper (speech-to-text) ────────────────────────────────────────────────
export interface WhisperOperationConfig {
  provider: 'whisper';
  model: string;
  language: string;
}

export type OperationConfig =
  | OpenAIOperationConfig
  | OpenAIEmbeddingConfig
  | WhisperOperationConfig;

export function isOpenAIConfig(c: OperationConfig): c is OpenAIOperationConfig {
  return c.provider === 'openai';
}

export function isOpenAIEmbeddingConfig(c: OperationConfig): c is OpenAIEmbeddingConfig {
  return c.provider === 'openai-embedding';
}

export function isWhisperConfig(c: OperationConfig): c is WhisperOperationConfig {
  return c.provider === 'whisper';
}

// ── Operation registry ──────────────────────────────────────────────────────
// Primary chat model: gpt-4.1-mini (released Apr 2025, best ROI in the mini tier).
// If unavailable on the account, swap to 'gpt-4o-mini'.
// All secondary ops run on gpt-4o-mini (stable, lower-cost).
// Transcription: gpt-4o-transcribe (higher accuracy than whisper-1).
// Embeddings: text-embedding-3-small (1536 dims, low cost, strong recall).
export const OPERATION_CONFIG: Record<string, OperationConfig> = {
  chat: {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    temperature: 0.7,
    maxTokens: 4000,
  },
  'chat:lead-analysis': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.5,
    maxTokens: 500,
  },
  'chat:prospectar': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.9,
    maxTokens: 2000,
  },
  'marketing:generate': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 2000,
  },
  approach: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.85,
    maxTokens: 200,
  },
  embed: {
    provider: 'openai-embedding',
    model: 'text-embedding-3-small',
  },
  transcribe: {
    provider: 'whisper',
    model: 'gpt-4o-transcribe',
    language: 'pt',
  },
};
