import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Kept for reference but chat/route.ts now calls OpenRouter directly
export const chatModel = openrouter("openai/gpt-4o-mini");
