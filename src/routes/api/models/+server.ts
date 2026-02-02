import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchModels } from '$lib/server/openrouter';

export const GET: RequestHandler = async ({ platform }) => {
  const apiKey = platform?.env?.OPENROUTER_API_KEY;

  if (!apiKey) {
    return json({ error: 'OpenRouter API key not configured' }, { status: 500 });
  }

  try {
    const models = await fetchModels(apiKey);

    // Group models by provider for better UX
    const grouped = models.reduce((acc, model) => {
      const provider = model.id.split('/')[0] || 'other';
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push({
        id: model.id,
        name: model.name,
        contextLength: model.context_length,
        pricing: model.pricing
      });
      return acc;
    }, {} as Record<string, Array<{ id: string; name: string; contextLength: number; pricing: { prompt: string; completion: string } }>>);

    return json({
      models: models.map(m => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length,
        pricing: m.pricing
      })),
      grouped
    });
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return json({ error: 'Failed to fetch models' }, { status: 500 });
  }
};
