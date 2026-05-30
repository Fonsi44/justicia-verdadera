import { generateText, streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

const RETRIES = 3;
const TIMEOUT_MS = 30000;

const model = deepseek("deepseek-v4-flash");

export interface AIOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callAI(prompt: string, options?: AIOptions) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const result = await generateText({
        model,
        prompt,
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
        abortSignal: controller.signal,
      });

      clearTimeout(timeout);
      return result;
    } catch (error) {
      if (attempt === RETRIES) throw error;
      console.warn(`[AI] Attempt ${attempt}/${RETRIES} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

export async function streamAI(prompt: string, options?: AIOptions) {
  const result = streamText({
    model,
    prompt,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxOutputTokens ?? 2048,
  });

  return result;
}
