// LLM-backed operations (chat + generate). The provider for each is decided
// by OPERATION_CONFIG, not by this type — an op here may run on Gemini or OpenAI.
export type LLMOperationName =
  | 'chat'
  | 'chat:lead-analysis'
  | 'chat:prospectar'
  | 'marketing:generate'
  | 'approach';

export type WhisperOperationName = 'transcribe';

export type OperationName = LLMOperationName | WhisperOperationName;

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
