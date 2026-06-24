export type GeminiOperationName =
  | 'chat'
  | 'chat:lead-analysis'
  | 'chat:prospectar'
  | 'marketing:generate'
  | 'approach';

export type WhisperOperationName = 'transcribe';

export type OperationName = GeminiOperationName | WhisperOperationName;

export interface NormalizedMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  systemPrompt: string;
  history: NormalizedMessage[];
  userMessage: string;
  operation: GeminiOperationName;
}

export interface GenerateOptions {
  prompt: string;
  operation: GeminiOperationName;
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
