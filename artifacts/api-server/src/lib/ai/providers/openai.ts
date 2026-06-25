import { JadeAIConfigError } from '../types.js';
import type { OpenAIOperationConfig, OpenAIVisionConfig, DallEConfig } from '../config.js';
import type { GenerateImageResult } from '../types.js';

type OpenAIChatRole = 'system' | 'user' | 'assistant';

interface OpenAIChatMessage {
  role: OpenAIChatRole;
  content: string | OpenAIContentPart[];
}

interface OpenAIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
}

export interface OpenAIHistoryItem {
  role: string;
  content: string;
}

const REQUEST_TIMEOUT_MS = 60000;
const EMBED_TIMEOUT_MS   = 20000;
const IMAGE_GEN_TIMEOUT  = 90000;

export class OpenAIProvider {
  constructor(private readonly apiKey: string) {}

  private assertKey(): void {
    if (!this.apiKey) {
      throw new JadeAIConfigError('OPENAI_API_KEY not configured');
    }
  }

  private async complete(
    messages: OpenAIChatMessage[],
    config: OpenAIOperationConfig | OpenAIVisionConfig,
  ): Promise<string> {
    this.assertKey();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_completion_tokens: config.maxTokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${errBody}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return (data.choices?.[0]?.message?.content ?? '').trim();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`OpenAI request timeout after ${REQUEST_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // Normalize history: system prompt first, then user/assistant turns.
  // Legacy messages stored with role 'model' (Gemini convention) are
  // converted to 'assistant' for backward compatibility.
  async chat(opts: {
    systemPrompt: string;
    history: OpenAIHistoryItem[];
    userMessage: string;
    config: OpenAIOperationConfig;
  }): Promise<string> {
    const messages: OpenAIChatMessage[] = [];

    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }

    for (const m of opts.history) {
      messages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      });
    }

    messages.push({ role: 'user', content: opts.userMessage });

    return this.complete(messages, opts.config);
  }

  async generate(opts: {
    prompt: string;
    config: OpenAIOperationConfig;
  }): Promise<string> {
    const messages: OpenAIChatMessage[] = [{ role: 'user', content: opts.prompt }];
    return this.complete(messages, opts.config);
  }

  // ── Vision: analyze image ───────────────────────────────────────────────────
  // Sends image as base64 data URI to the vision-capable model.
  // Returns a textual analysis (Portuguese by default via system prompt).
  async analyzeImage(opts: {
    imageBase64: string;
    mimeType: string;
    prompt: string;
    systemPrompt: string;
    config: OpenAIVisionConfig;
  }): Promise<string> {
    this.assertKey();

    const dataUri = `data:${opts.mimeType};base64,${opts.imageBase64}`;

    const messages: OpenAIChatMessage[] = [];

    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }

    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: dataUri, detail: 'high' },
        },
        {
          type: 'text',
          text: opts.prompt,
        },
      ],
    });

    return this.complete(messages, opts.config);
  }

  // ── DALL-E 3: generate image ────────────────────────────────────────────────
  // Returns the CDN URL of the generated image and the revised prompt.
  async generateImage(opts: {
    prompt: string;
    config: DallEConfig;
  }): Promise<GenerateImageResult> {
    this.assertKey();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_GEN_TIMEOUT);
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: opts.config.model,
          prompt: opts.prompt,
          n: 1,
          size: opts.config.size,
          quality: opts.config.quality,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`DALL-E API error ${res.status}: ${errBody}`);
      }

      const data = (await res.json()) as {
        data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
      };

      const item = data.data[0];
      if (!item) throw new Error('Image generation API returned no data');

      // gpt-image-1 returns b64_json; dall-e-3 returns url
      if (item.url) {
        return { url: item.url, revisedPrompt: item.revised_prompt ?? opts.prompt };
      }

      if (item.b64_json) {
        const dataUri = `data:image/png;base64,${item.b64_json}`;
        return { url: dataUri, revisedPrompt: item.revised_prompt ?? opts.prompt, isDataUri: true };
      }

      throw new Error('Image generation API returned neither url nor b64_json');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`DALL-E request timeout after ${IMAGE_GEN_TIMEOUT}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Embeddings API ──────────────────────────────────────────────────────────
  // Returns one embedding vector per input text, in input order.
  async embed(opts: { texts: string[]; model: string }): Promise<number[][]> {
    this.assertKey();
    if (opts.texts.length === 0) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: opts.model, input: opts.texts }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenAI Embeddings API error ${res.status}: ${errBody}`);
      }

      const data = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      return data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`OpenAI Embeddings timeout after ${EMBED_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
