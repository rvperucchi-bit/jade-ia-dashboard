import { GoogleGenerativeAI } from '@google/generative-ai';
import { JadeAIConfigError } from '../types.js';
import type { GeminiOperationConfig } from '../config.js';

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
