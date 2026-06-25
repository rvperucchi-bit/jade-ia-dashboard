import { logger } from '../logger.js';
import {
  OPERATION_CONFIG,
  isOpenAIConfig,
  isOpenAIVisionConfig,
  isDallEConfig,
  isOpenAIEmbeddingConfig,
  isWhisperConfig,
  type OperationConfig,
} from './config.js';
import { OpenAIProvider } from './providers/openai.js';
import { WhisperProvider } from './providers/whisper.js';
import { JadeAIConfigError } from './types.js';
import type {
  ChatOptions,
  EmbedOptions,
  GenerateOptions,
  TranscribeOptions,
  AnalyzeImageOptions,
  GenerateImageOptions,
  GenerateImageResult,
} from './types.js';

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

export class JadeAIEngine {
  private openai: OpenAIProvider;
  private whisper: WhisperProvider;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY ?? '';
    if (!openaiKey) {
      logger.warn('OPENAI_API_KEY not set — all AI operations will fail at runtime');
    }
    this.openai = new OpenAIProvider(openaiKey);
    this.whisper = new WhisperProvider(openaiKey);
  }

  async chat(opts: ChatOptions): Promise<string> {
    const config = resolveConfig(opts.operation);
    if (!isOpenAIConfig(config)) {
      throw new JadeAIConfigError(
        `Operation '${opts.operation}' is not an OpenAI chat operation (provider=${config.provider})`,
      );
    }

    const t0 = Date.now();
    const text = await withRetry(
      () =>
        this.openai.chat({
          systemPrompt: opts.systemPrompt,
          history: opts.history,
          userMessage: opts.userMessage,
          config,
        }),
      opts.operation,
    );

    logger.info(
      { operation: opts.operation, model: config.model, ms: Date.now() - t0, chars: text.length },
      'jade-ai: chat complete',
    );
    return text;
  }

  async generate(opts: GenerateOptions): Promise<string> {
    const config = resolveConfig(opts.operation);
    if (!isOpenAIConfig(config)) {
      throw new JadeAIConfigError(
        `Operation '${opts.operation}' is not an OpenAI generate operation (provider=${config.provider})`,
      );
    }

    const t0 = Date.now();
    const text = await withRetry(
      () => this.openai.generate({ prompt: opts.prompt, config }),
      opts.operation,
    );

    logger.info(
      { operation: opts.operation, model: config.model, ms: Date.now() - t0, chars: text.length },
      'jade-ai: generate complete',
    );
    return text;
  }

  // ── Vision: analyze image ───────────────────────────────────────────────────
  async analyzeImage(opts: AnalyzeImageOptions): Promise<string> {
    const config = resolveConfig('image-analysis');
    if (!isOpenAIVisionConfig(config)) {
      throw new JadeAIConfigError('image-analysis operation is not configured as openai-vision');
    }

    const systemPrompt =
      opts.systemPrompt ??
      'Você é JADE, assistente comercial especializada em vendas B2B no mercado brasileiro. ' +
      'Analise a imagem enviada com foco em informações relevantes para vendas: ' +
      'identifique empresas, produtos, materiais de marketing, propostas, contratos ou qualquer ' +
      'elemento comercial. Responda em português, de forma objetiva e acionável.';

    const prompt =
      opts.prompt ?? 'Analise esta imagem e extraia as informações mais relevantes para uma equipe de vendas.';

    const t0 = Date.now();
    const text = await withRetry(
      () =>
        this.openai.analyzeImage({
          imageBase64: opts.imageBase64,
          mimeType: opts.mimeType,
          prompt,
          systemPrompt,
          config,
        }),
      'image-analysis',
    );

    logger.info(
      { model: config.model, ms: Date.now() - t0, chars: text.length },
      'jade-ai: image-analysis complete',
    );
    return text;
  }

  // ── DALL-E 3: generate image ────────────────────────────────────────────────
  async generateImage(opts: GenerateImageOptions): Promise<GenerateImageResult> {
    const config = resolveConfig('image-generation');
    if (!isDallEConfig(config)) {
      throw new JadeAIConfigError('image-generation operation is not configured as dalle');
    }

    const effectiveConfig = {
      ...config,
      size:    opts.size    ?? config.size,
      quality: opts.quality ?? config.quality,
    };

    const t0 = Date.now();
    const result = await withRetry(
      () => this.openai.generateImage({ prompt: opts.prompt, config: effectiveConfig }),
      'image-generation',
    );

    logger.info(
      { model: config.model, ms: Date.now() - t0 },
      'jade-ai: image-generation complete',
    );
    return result;
  }

  async embed(opts: EmbedOptions): Promise<number[][]> {
    const config = resolveConfig('embed');
    if (!isOpenAIEmbeddingConfig(config)) {
      throw new JadeAIConfigError('Embedding operation is not configured as openai-embedding');
    }

    const t0 = Date.now();
    const embeddings = await withRetry(
      () => this.openai.embed({ texts: opts.texts, model: config.model }),
      'embed',
    );

    logger.info(
      { count: opts.texts.length, model: config.model, ms: Date.now() - t0 },
      'jade-ai: embed complete',
    );
    return embeddings;
  }

  async transcribe(opts: TranscribeOptions): Promise<string> {
    const config = resolveConfig('transcribe');
    if (!isWhisperConfig(config)) {
      throw new JadeAIConfigError('transcribe operation is not configured as whisper');
    }

    const t0 = Date.now();
    const text = await withRetry(
      () =>
        this.whisper.transcribe({
          audioBase64: opts.audioBase64,
          mimeType: opts.mimeType,
          model: config.model,
          language: config.language,
        }),
      'transcribe',
    );

    logger.info(
      { model: config.model, ms: Date.now() - t0, chars: text.length },
      'jade-ai: transcribe complete',
    );
    return text;
  }
}

export const engine = new JadeAIEngine();
