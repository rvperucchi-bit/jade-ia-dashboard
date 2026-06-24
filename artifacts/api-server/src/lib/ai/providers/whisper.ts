import { JadeAIConfigError } from '../types.js';

export class WhisperProvider {
  constructor(private readonly apiKey: string) {}

  private assertKey(): void {
    if (!this.apiKey) {
      throw new JadeAIConfigError('OPENAI_API_KEY not configured');
    }
  }

  async transcribe(opts: {
    audioBase64: string;
    mimeType: string;
    model: string;
    language: string;
  }): Promise<string> {
    this.assertKey();
    const { audioBase64, mimeType, model, language } = opts;
    const resolvedMime = mimeType || 'audio/m4a';
    const fileName =
      resolvedMime === 'audio/wav' ? 'audio.wav'
      : resolvedMime === 'audio/webm' ? 'audio.webm'
      : 'audio.m4a';

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: resolvedMime });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('model', model);
    formData.append('language', language);

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Whisper API error ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as { text: string };
    return data.text.trim();
  }
}
