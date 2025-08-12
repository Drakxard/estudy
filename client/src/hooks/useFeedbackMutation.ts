// src/hooks/useFeedbackMutation.ts

import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { Exercise } from '@/types';

interface FeedbackRequest {
  exercise: Exercise;
  response: string;
  /** Si true, llama al endpoint de narración estilo podcast */
  narrate?: boolean;
}

export function useFeedbackMutation() {
  const { settings } = useAppStore();

  return useMutation<string, Error, FeedbackRequest>({
    mutationFn: async ({ exercise, response, narrate = false }) => {
      if (!settings?.groqApiKey) {
        throw new Error('API key no configurada');
      }

      // Escoge el endpoint según el flag narrate
      const endpoint = narrate
        ? '/api/ai/feedback-narrate'
        : '/api/ai/feedback';

      // Construye el payload común
      const payload: Record<string, any> = {
        exercises: [exercise],
        responses: [response],
        apiKey: settings.groqApiKey,
        modelId: settings.groqModelId || 'deepseek-r1-distill-llama-70b',
      };

      // Solo en feedback “normal” inyectamos customPrompt
      if (!narrate) {
        payload.customPrompt = settings.feedbackPrompt;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      // Devuelve data.feedback o data.narration según el modo
      return narrate
        ? (data.narration as string)
        : (data.feedback as string);
    }
  });
}
