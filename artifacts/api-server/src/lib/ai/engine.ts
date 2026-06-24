import { logger } from '../logger.js';
import {
  OPERATION_CONFIG,
  isGeminiConfig,
  isOpenAIConfig,
  isWhisperConfig,
  type OperationConfig,
} from './config.js';
import { GeminiProvider, type GeminiHistory } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';
import { WhisperProvider } from './providers/whisper.js';
import { JadeAIConfigError } from './types.js';
import type { ChatOptions, GenerateOptions, TranscribeOptions } from './types.js';

function isTransient(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('429') ||
    msg.includes('timeout') ||
    msg.includes('network')
  );
}

async function withRetry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof JadeAIConfigError) throw err;
    if (isTransient(err)) {
      logger.warn({ operation }, 'jade-ai: transient error — retrying in 1.5s');
      await new Promise<void>((r) => setTimeout(r, 1500));
      return await fn();
    }
    throw err;
  }
}

function resolveConfig(operation: string): OperationConfig {
  const config: OperationConfig | undefined = OPERATION_CONFIG[operation];
  if (!config) throw new JadeAIConfigError(`Unknown AI operation: '${operation}'`);
  return config;
}

function resolveWhisperConfig(operation: string) {
  const config: OperationConfig | undefined = OPERATION_CONFIG[operation];
  if (!config) throw new JadeAIConfigError(`Unknown AI operation: '${operation}'`);
  if (!isWhisperConfig(config)) {
    throw new JadeAIConfigError(`Operation '${operation}' is not a Whisper operation (provider=${config.provider})`);
  }
  return config;
}

export class JadeAIEngine {
  private gemini: GeminiProvider;
  private openai: OpenAIProvider;
  private whisper: WhisperProvider;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY ?? '';
    const openaiKey = process.env.OPENAI_API_KEY ?? '';

    if (!geminiKey) logger.warn('GEMINI_API_KEY not set — Gemini operations will fail at runtime');
    if (!openaiKey) logger.warn('OPENAI_API_KEY not set — OpenAI chat and transcription will fail at runtime');

    this.gemini = new GeminiProvider(geminiKey);
    this.openai = new OpenAIProvider(openaiKey);
    this.whisper = new WhisperProvider(openaiKey);
  }

  async chat(opts: ChatOptions): Promise<string> {
    const config = resolveConfig(opts.operation);
    const t0 = Date.now();
    let text: string;

    if (isOpenAIConfig(config)) {
      // OpenAI provider normalizes history internally (system first,
      // user/assistant turns, legacy 'model' → 'assistant').
      text = await withRetry(
        () => this.openai.chat({
          systemPrompt: opts.systemPrompt,
          history: opts.history,
          userMessage: opts.userMessage,
          config,
        }),
        opts.operation,
      );
    } else if (isGeminiConfig(config)) {
      const rawHistory: GeminiHistory = opts.history.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.content }],
      }));
      const firstUserIdx = rawHistory.findIndex((h) => h.role === 'user');
      const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

      text = await withRetry(
        () => this.gemini.chat({ systemPrompt: opts.systemPrompt, history, userMessage: opts.userMessage, config }),
        opts.operation,
      );
    } else {
      throw new JadeAIConfigError(`Operation '${opts.operation}' is not a chat-capable operation (provider=${config.provider})`);
    }

    logger.info({ operation: opts.operation, provider: config.provider, ms: Date.now() - t0, chars: text.length }, 'jade-ai: chat complete');
    return text;
  }

  async generate(opts: GenerateOptions): Promise<string> {
    const config = resolveConfig(opts.operation);
    const t0 = Date.now();
    let text: string;

    if (isOpenAIConfig(config)) {
      text = await withRetry(() => this.openai.generate({ prompt: opts.prompt, config }), opts.operation);
    } else if (isGeminiConfig(config)) {
      text = await withRetry(() => this.gemini.generate({ prompt: opts.prompt, config }), opts.operation);
    } else {
      throw new JadeAIConfigError(`Operation '${opts.operation}' is not a generate-capable operation (provider=${config.provider})`);
    }

    logger.info({ operation: opts.operation, provider: config.provider, ms: Date.now() - t0, chars: text.length }, 'jade-ai: generate complete');
    return text;
  }

  async transcribe(opts: TranscribeOptions): Promise<string> {
    const config = resolveWhisperConfig('transcribe');

    const t0 = Date.now();
    const text = await withRetry(
      () => this.whisper.transcribe({
        audioBase64: opts.audioBase64,
        mimeType: opts.mimeType,
        model: config.model,
        language: config.language,
      }),
      'transcribe',
    );
    logger.info({ ms: Date.now() - t0, chars: text.length }, 'jade-ai: transcribe complete');
    return text;
  }
}

export const engine = new JadeAIEngine();
