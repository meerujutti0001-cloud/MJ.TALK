import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://mj-talk.vercel.app",
    "X-Title": "MJ.TALK Support",
  },
});

// Primary: GPT-4o-mini (fast, cheap, reliable on OpenRouter)
// Fallback models in order: meta-llama, mistral
export const chatModel = openrouter("openai/gpt-4o-mini");
