import { createOpenAI } from '@ai-sdk/openai';

// Create OpenAI-compatible provider pointing at our backend
const provider = createOpenAI({
  baseURL: '/v1',
  apiKey: 'dummy', // Not needed for local backend, but required by the SDK
});

// Export a function that returns chat completion models (not responses API)
export const openai = (modelId: string) => provider.chat(modelId);
