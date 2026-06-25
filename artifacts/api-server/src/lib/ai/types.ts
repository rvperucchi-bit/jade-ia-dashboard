// LLM-backed operations (chat + generate). All run on OpenAI.
export type LLMOperationName =
  | 'chat'
  | 'chat:lead-analysis'
  | 'chat:prospectar'
  | 'marketing:generate'
  | 'approach';

export type VisionOperationName = 'image-analysis';
export type ImageGenOperationName = 'image-generation';
export type EmbedOperationName = 'embed';
export type WhisperOperationName = 'transcribe';

export type OperationName =
  | LLMOperationName
  | VisionOperationName
  | ImageGenOperationName
  | EmbedOperationName
  | WhisperOperationName;

export interface NormalizedMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  systemPrompt: string;
  history: NormalizedMessage[];
  userMessage: string;
  operation: LLMOperationName;
}

export interface GenerateOptions {
  prompt: string;
  operation: LLMOperationName;
}

// ── Vision ──────────────────────────────────────────────────────────────────
export interface AnalyzeImageOptions {
  /** Base64-encoded image data (no data URI prefix). */
  imageBase64: string;
  /** MIME type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' */
  mimeType: string;
  /** Optional user question about the image. Defaults to a sales-analysis prompt. */
  prompt?: string;
  /** Optional system prompt override. Uses JADE default if omitted. */
  systemPrompt?: string;
}

// ── Image generation ────────────────────────────────────────────────────────
export interface GenerateImageOptions {
  prompt: string;
  /** Defaults to config value (1024x1024). */
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  /** Defaults to config value. dall-e-3: 'standard'|'hd'. gpt-image-*: 'low'|'medium'|'high'|'auto'. */
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
}

export interface GenerateImageResult {
  /** CDN URL (dall-e-3) OR data URI base64 (gpt-image-1). Always present. */
  url: string;
  revisedPrompt: string;
  /** true when url is a data:image/... base64 data URI instead of a CDN link */
  isDataUri?: boolean;
}

// ── Embeddings ──────────────────────────────────────────────────────────────
export interface EmbedOptions {
  texts: string[];
}

// ── Transcription ───────────────────────────────────────────────────────────
export interface TranscribeOptions {
  audioBase64: string;
  mimeType: string;
}

export class JadeAIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JadeAIConfigError';
  }
}
