// LLM-backed operations (chat + generate). All run on OpenAI.
export type LLMOperationName =
  | 'chat'
  | 'chat:lead-analysis'
  | 'chat:prospectar'
  | 'marketing:generate'
  | 'approach';

export type EmbedOperationName = 'embed';

export type WhisperOperationName = 'transcribe';

export type OperationName = LLMOperationName | EmbedOperationName | WhisperOperationName;

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

export interface EmbedOptions {
  texts: string[];
}

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
