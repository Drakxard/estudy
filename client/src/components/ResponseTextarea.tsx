import { useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { apiRequest } from '@/lib/queryClient';
import type { Response } from '@shared/schema';

interface ResponseTextareaProps {
  className?: string;
}

export function ResponseTextarea({ className }: ResponseTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    currentExercise,
    currentResponse,
    setCurrentResponse,
    nextExercise,
    setAutoSaveStatus,
    exercises,
    currentSectionId,
    currentExerciseIndex,
  } = useAppStore();

  // Get current response from server
  const { data: savedResponse } = useQuery<Response | null>({
    queryKey: ['/api/responses', currentExercise?.id],
    enabled: !!currentExercise?.id,
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentExercise) throw new Error('No current exercise');
      
      const response = await apiRequest('POST', '/api/responses', {
        exerciseId: currentExercise.id,
        content,
      });
      return response.json();
    },
    onMutate: () => {
      setAutoSaveStatus('saving');
    },
    onSuccess: () => {
      setAutoSaveStatus('saved');
    },
    onError: () => {
      setAutoSaveStatus('error');
    },
  });

  // Auto-save function
  const autoSave = useCallback((content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (content.trim()) {
        saveResponseMutation.mutate(content);
      }
    }, 2000); // Save after 2 seconds of inactivity
  }, [saveResponseMutation]);

  // Load saved response when exercise changes
  useEffect(() => {
    if (savedResponse?.content && savedResponse.content !== currentResponse) {
      setCurrentResponse(savedResponse.content);
    } else if (!savedResponse && currentResponse) {
      setCurrentResponse('');
    }
  }, [savedResponse, currentExercise?.id]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
    }
  }, []);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setCurrentResponse(content);
    autoSave(content);
    resizeTextarea();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (currentResponse.trim()) {
        saveResponseMutation.mutate(currentResponse);
        nextExercise();
      }
    } else if (e.key === 's' && e.ctrlKey) {
      e.preventDefault();
      if (currentResponse.trim()) {
        saveResponseMutation.mutate(currentResponse);
      }
    }
  };

  // Auto-focus and resize on mount/exercise change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      setTimeout(resizeTextarea, 100);
    }
  }, [currentExercise?.id, resizeTextarea]);

  // Calculate progress
  const sectionExercises = exercises.filter(ex => ex.sectionId === currentSectionId);
  const progressPercentage = sectionExercises.length > 0 
    ? ((currentExerciseIndex + 1) / sectionExercises.length) * 100 
    : 0;

  // Auto-save status text
  const getAutoSaveText = () => {
    switch (useAppStore.getState().autoSaveStatus) {
      case 'saving': return 'Guardando...';
      case 'saved': return 'Guardado automáticamente';
      case 'error': return 'Error al guardar';
      default: return 'Guardado automáticamente';
    }
  };

  return (
    <div className={`w-full ${className || ''}`}>
      <label htmlFor="response" className="sr-only">Escribe tu respuesta</label>
      <textarea
        ref={textareaRef}
        id="response"
        value={currentResponse}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu respuesta aquí... (Presiona Ctrl+Enter para continuar al siguiente ejercicio)"
        className="w-full h-64 bg-gray-925 border border-gray-800 rounded-xl p-6 text-lg leading-relaxed resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
      />
      
      {/* Progress Indicator */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-32 bg-gray-800 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span>
            {currentExerciseIndex + 1} de {sectionExercises.length}
          </span>
        </div>
        
        <div className="text-gray-600">
          <span>{getAutoSaveText()}</span>
        </div>
      </div>
    </div>
  );
}
