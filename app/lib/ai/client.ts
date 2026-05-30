import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

const RETRIES = 3;
const TIMEOUT_MS = 30000;

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function callAI(prompt: string, options?: AIOptions) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const result = await generateText({
        model: deepseek("deepseek-v4-flash"),
        prompt,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048,
        abortSignal: controller.signal,
      });

      clearTimeout(timeout);
      return result;
    } catch (error) {
      if (attempt === RETRIES) throw error;
      console.warn(`[AI] Attempt ${attempt}/${RETRIES} failed, retrying...`);
      // Backoff exponencial: 1s, 2s, 3s
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}