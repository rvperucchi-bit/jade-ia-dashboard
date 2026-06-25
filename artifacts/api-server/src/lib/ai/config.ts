// ── OpenAI Chat / Generate ──────────────────────────────────────────────────
export interface OpenAIOperationConfig {
  provider: 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
}

// ── OpenAI Vision (image analysis) ──────────────────────────────────────────
export interface OpenAIVisionConfig {
  provider: 'openai-vision';
  model: string;
  temperature: number;
  maxTokens: number;
}

// ── OpenAI DALL-E / gpt-image-* (image generation) ──────────────────────────
// quality values differ by model:
//   dall-e-3    → 'standard' | 'hd'
//   gpt-image-* → 'low' | 'medium' | 'high' | 'auto'
export interface DallEConfig {
  provider: 'dalle';
  model: string;
  size: '1024x1024' | '1792x1024' | '1024x1792' | '1536x1024' | '1024x1536' | 'auto';
  quality: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
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
  | OpenAIVisionConfig
  | DallEConfig
  | OpenAIEmbeddingConfig
  | WhisperOperationConfig;

export function isOpenAIConfig(c: OperationConfig): c is OpenAIOperationConfig {
  return c.provider === 'openai';
}

export function isOpenAIVisionConfig(c: OperationConfig): c is OpenAIVisionConfig {
  return c.provider === 'openai-vision';
}

export function isDallEConfig(c: OperationConfig): c is DallEConfig {
  return c.provider === 'dalle';
}

export function isOpenAIEmbeddingConfig(c: OperationConfig): c is OpenAIEmbeddingConfig {
  return c.provider === 'openai-embedding';
}

export function isWhisperConfig(c: OperationConfig): c is WhisperOperationConfig {
  return c.provider === 'whisper';
}

// ── Operation registry ──────────────────────────────────────────────────────
// Primary chat model: gpt-5.4-mini (recommended on account, Jun 2025).
// Fallback: swap to 'gpt-4.1-mini' if unavailable.
// Image analysis: gpt-4o (vision-capable; gpt-5.4-mini vision availability TBD).
// Image generation: dall-e-3 (highest quality available).
// All secondary ops run on gpt-4o-mini (stable, lower-cost).
// Transcription: gpt-4o-transcribe (higher accuracy than whisper-1).
// Embeddings: text-embedding-3-small (1536 dims, low cost, strong recall).
export const OPERATION_CONFIG: Record<string, OperationConfig> = {
  chat: {
    provider: 'openai',
    model: 'gpt-5.4-mini',
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
  // ── NEW: Vision ────────────────────────────────────────────────────────────
  'image-analysis': {
    provider: 'openai-vision',
    model: 'gpt-4o',
    temperature: 0.4,
    maxTokens: 1500,
  },
  // ── NEW: Image generation ──────────────────────────────────────────────────
  // gpt-image-1 is the image generation model available on this account.
  // dall-e-3 / dall-e-2 are not provisioned here.
  'image-generation': {
    provider: 'dalle',
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'medium',
  },
  // ── Embeddings + Transcription ─────────────────────────────────────────────
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
