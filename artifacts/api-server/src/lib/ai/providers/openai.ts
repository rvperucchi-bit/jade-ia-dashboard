import { JadeAIConfigError } from '../types.js';
import type { OpenAIOperationConfig } from '../config.js';

type OpenAIChatRole = 'system' | 'user' | 'assistant';

interface OpenAIChatMessage {
  role: OpenAIChatRole;
  content: string;
}

export interface OpenAIHistoryItem {
  role: string;
  content: string;
}

const REQUEST_TIMEOUT_MS = 60000;

export class OpenAIProvider {
  constructor(private readonly apiKey: string) {}

  private assertKey(): void {
    if (!this.apiKey) {
      throw new JadeAIConfigError('OPENAI_API_KEY not configured');
    }
  }

  private async complete(
    messages: OpenAIChatMessage[],
    config: OpenAIOperationConfig,
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
          max_tokens: config.maxTokens,
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

  // Normalize history for OpenAI: system prompt first, then user/assistant
  // turns. Legacy messages stored with role 'model' (Gemini convention) are
  // converted to 'assistant'.
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
}
