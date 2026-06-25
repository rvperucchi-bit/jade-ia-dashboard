// ── GEMINI PROVIDER — ISOLATED (not used by JadeAIEngine) ────────────────────
// Kept for reference / rollback only. All core operations now run on OpenAI.
// Do NOT import this file from engine.ts or any active route.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { JadeAIConfigError } from '../types.js';

interface GeminiOperationConfig {
  provider: 'gemini';
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export type GeminiHistory = Array<{
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}>;

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private assertKey(): void {
    if (!this.apiKey) {
      throw new JadeAIConfigError('GEMINI_API_KEY not configured');
    }
  }

  async chat(opts: {
    systemPrompt: string;
    history: GeminiHistory;
    userMessage: string;
    config: GeminiOperationConfig;
  }): Promise<string> {
    this.assertKey();
    const model = this.genAI.getGenerativeModel({
      model: opts.config.model,
      systemInstruction: opts.systemPrompt,
      generationConfig: {
        maxOutputTokens: opts.config.maxOutputTokens,
        temperature: opts.config.temperature,
      },
    });
    const chat = model.startChat({ history: opts.history });
    const result = await chat.sendMessage(opts.userMessage);
    return result.response.text();
  }

  async generate(opts: {
    prompt: string;
    config: GeminiOperationConfig;
  }): Promise<string> {
    this.assertKey();
    const model = this.genAI.getGenerativeModel({
      model: opts.config.model,
      generationConfig: {
        maxOutputTokens: opts.config.maxOutputTokens,
        temperature: opts.config.temperature,
      },
    });
    const result = await model.generateContent(opts.prompt);
    return result.response.text();
  }
}
