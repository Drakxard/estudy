import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export function FeedbackDialog() {
  const {
    showFeedbackDialog,
    setShowFeedbackDialog,
    exercises,
    currentSectionId,
    responses,
    settings,
  } = useAppStore();

  const [feedback, setFeedback] = useState<string>('');

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const sectionExercises = exercises.filter(ex => ex.sectionId === currentSectionId);
      const sectionResponses = sectionExercises.map(ex => responses[ex.id] || '');
      
      if (!settings?.groqApiKey) {
        throw new Error('API key not configured');
      }

      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercises: sectionExercises,
          responses: sectionResponses,
          apiKey: settings.groqApiKey,
          modelId: settings.groqModelId || 'llama-3.1-8b-instant',
          customPrompt: settings.feedbackPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setFeedback(data.feedback);
    },
  });

  const handleClose = () => {
    setShowFeedbackDialog(false);
    setFeedback('');
  };

  const handleGetFeedback = () => {
    feedbackMutation.mutate();
  };

  return (
    <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-100">¿Feedback?</DialogTitle>
          <DialogDescription className="text-gray-400">
            Has completado la sección {currentSectionId}. ¿Te gustaría recibir retroalimentación sobre tu progreso?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!feedback && !feedbackMutation.isPending && (
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                Puedo analizar tus respuestas y proporcionarte retroalimentación personalizada para mejorar tu comprensión.
              </p>
              <Button
                onClick={handleGetFeedback}
                disabled={!settings?.groqApiKey}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Obtener Feedback
              </Button>
              {!settings?.groqApiKey && (
                <p className="text-sm text-red-400 mt-2">
                  Configura tu API key de GROQ en ajustes para usar esta función
                </p>
              )}
            </div>
          )}

          {feedbackMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-gray-300">Analizando tus respuestas...</span>
            </div>
          )}

          {feedbackMutation.isError && (
            <div className="text-red-400 text-center">
              Error al obtener feedback: {feedbackMutation.error?.message || 'Error desconocido'}
            </div>
          )}

          {feedback && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-100">Retroalimentación:</h3>
              <div className="min-h-[300px] bg-gray-800 border border-gray-600 rounded-md p-4 text-gray-100">
                <MathRenderer content={feedback} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline" className="border-gray-600 text-gray-300">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}