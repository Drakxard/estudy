// src/hooks/useNarrateFeedbackMutation.ts
import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';

interface NarrationRequest {
  exercise: Exercise;
  response: string;
}

export function useNarrateFeedbackMutation() {
  const { settings } = useAppStore();

  return useMutation<string, Error, NarrationRequest>({
    mutationFn: async ({ exercise, response }) => {
      if (!settings?.groqApiKey) {
        throw new Error('API key no configurada');
      }

      const res = await fetch('/api/ai/feedback-narrate', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercises: [exercise],
          responses: [response],
          apiKey: settings.groqApiKey,
          modelId: settings.groqModelId || 'deepseek-r1-distill-llama-70b',
          // no usamos customPrompt aquí: el servidor inyecta su propio prompt de narración
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.narration as string;
    },
  });
}
