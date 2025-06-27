import { useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Timer } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { SectionTransitionDialog } from '@/components/SectionTransitionDialog';
import { RestBreakDialog } from '@/components/RestBreakDialog';
import { BKTProgress } from '@/components/BKTProgress';
import type { Exercise, Settings as SettingsType } from '@shared/schema';
import { MathRenderer } from '@/components/MathRenderer';
export default function StudyInterface() {
  const {
    setExercises,
    setSettings,
    toggleSettings,
    currentSectionId,
    setCurrentSection,
    currentExercise,
    currentExerciseIndex,
    currentResponse,
    setCurrentResponse,
    saveResponse,
    nextExercise,
    previousExercise,
    exercises,
    timer,
    startTimer,
    decrementTimer,
    pauseTimer,
    isSettingsOpen,
    setAutoSaveStatus,
    autoSaveStatus,
    settings: appSettings,
    lastCursorPos, setLastCursorPos,
  } = useAppStore();
  // Ref para el textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: exercisesData } = useQuery<Exercise[]>({ queryKey: ['/api/exercises'] });
  const { data: settings } = useQuery<SettingsType>({ queryKey: ['/api/settings'] });

  // Guardar posición en cada cambio
  const handleResponseChange = (value: string) => {
    setCurrentResponse(value);
    const pos = textareaRef.current?.selectionStart ?? 0;
    if (currentExercise) {
      setLastCursorPos({
        ...lastCursorPos,
        [currentExercise.id]: pos,
      });
    }
  };
  // Al montar o cambiar de ejercicio, restaurar cursor
  useEffect(() => {
    if (!textareaRef.current || !currentExercise) return;
    textareaRef.current.value = currentResponse;
    const pos = lastCursorPos[currentExercise.id] ?? currentResponse.length;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos);
    // Opcional: desplazar scroll hasta la posición
    const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight || "20");
    textareaRef.current.scrollTop = Math.max(0, (pos / 50) * lineHeight - textareaRef.current.clientHeight / 2);
  }, [currentExercise, currentResponse, lastCursorPos]);

  const autoSaveMutation = useMutation({
    mutationFn: async ({ exerciseId, content }: { exerciseId: number; content: string }) => {
      setAutoSaveStatus('saving');
      const res = await fetch('/api/responses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, content })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    },
    onSuccess: () => setAutoSaveStatus('saved'),
    onError: () => setAutoSaveStatus('error'),
  });

  useEffect(() => { if (exercisesData) setExercises(exercisesData); }, [exercisesData, setExercises]);
  useEffect(() => { if (settings) { setSettings(settings); if (settings.currentSection) setCurrentSection(settings.currentSection); } }, [settings, setSettings, setCurrentSection]);

  useEffect(() => {
    if (!timer.isRunning) return;
    const id = setInterval(() => {
      if (timer.minutes === 0 && timer.seconds === 0) { pauseTimer(); clearInterval(id); }
      else decrementTimer();
    }, 1000);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.minutes, timer.seconds, decrementTimer, pauseTimer]);

// Función para guardar texto y posición, y luego avanzar/retroceder
  const saveCurrentResponse = useCallback(() => {
    if (!currentExercise) return;

    // 1. Guardar posición del cursor
    const pos = textareaRef.current?.selectionStart ?? 0;
    setLastCursorPos({
      ...lastCursorPos,
      [currentExercise.id]: pos,
    });

    // 2. Guardar el contenido en tu backend/store
    saveResponse(currentExercise.id, currentResponse);

    // NOTA: no navega aquí; la navegación la llamamos desde los atajos
  }, [
    currentExercise,
    currentResponse,
    lastCursorPos,
    saveResponse,
    setLastCursorPos,
  ]);

  // Atajos de teclado: Esc para settings, Ctrl+← y Ctrl+→ para cambiar de ejercicio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleSettings();
      }
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        saveCurrentResponse();
        previousExercise();
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        saveCurrentResponse();
        nextExercise();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    toggleSettings,
    previousExercise,
    nextExercise,
    saveCurrentResponse, // importante incluirla como dependencia
  ]);
  const sectionExercises = exercises.filter(ex => ex.sectionId === currentSectionId);
  const totalSections = exercises.length ? Math.max(...exercises.map(ex => ex.sectionId)) : 1;
  const formatTime = (m: number, s: number) => `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  const getExerciseText = () => {
    if (!currentExercise) return 'Selecciona una sección para comenzar';
    const { enunciado, ejercicio } = currentExercise;
    return enunciado && ejercicio ? `${enunciado}\n\n${ejercicio}` : ejercicio || enunciado || 'Sin contenido';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col relative">
      {/* --- Section Hover Navigator (pega SOLO este bloque) --- */}
    <div className="fixed top-1/2 left-0 transform -translate-y-1/2">
      <div className="group relative h-32 w-4">
        {/* Hotspot */}
        <div className="absolute inset-y-0 left-0 w-2 cursor-pointer"></div>
        {/* Navigator panel */}
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 flex flex-col space-y-2 z-50 bg-gray-800 p-2 rounded-r-lg shadow-lg">
          {Array.from({ length: totalSections }, (_, i) => i + 1).map(id => (
            <button
              key={id}
              onClick={() => { saveCurrentResponse(); setCurrentSection(id); }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                id === currentSectionId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
    {/* --- Fin Section Hover Navigator --- */}


      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="text-sm text-gray-400">Sección {currentSectionId}/{totalSections}</div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Timer className="w-4 h-4" /><span className="font-mono">{formatTime(timer.minutes, timer.seconds)}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleSettings} className="p-2 hover:bg-gray-800 hover:text-white text-gray-400"><Settings className="w-4 h-4"/></Button>
      </div>

{/* Main Content */}
<div className="flex-1 flex">
  {/* Left Navigation */}
  <div className="w-12 flex items-center justify-center border-r border-gray-800">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        saveCurrentResponse();
        previousExercise();
      }}
      disabled={currentExerciseIndex === 0}
      className="p-2 hover:bg-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-30"
    >
      <ChevronLeft className="w-5 h-5" />
    </Button>
  </div>

  {/* Center Content */}
  <div className="flex-1 flex flex-col">
    {/* Exercise Statement */}
    <div className="flex-1 p-6 flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full space-y-6">

        {/* Topic */}
        {currentExercise && (
          <div className="text-center text-blue-300 uppercase tracking-wide text-sm">
            {currentExercise.tema}
          </div>
        )}

          {/* Statement Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-md">
            <div className="space-y-4 text-lg leading-relaxed">
              <MathRenderer content={getExerciseText()} />
            </div>
          </div>
              {/* Response Area */}
              <div className="space-y-4">
                <textarea
                  value={currentResponse}
                  onChange={(e) => {
                    setCurrentResponse(e.target.value);
                    // Start timer when user begins typing
                    if (e.target.value.length === 1 && !timer.isRunning) {
                      startTimer();
                    }
                  }}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full h-64 bg-gray-925 border border-gray-800 rounded-xl p-6 text-lg leading-relaxed resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                />

                {/* Progress */}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-800 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${sectionExercises.length > 0 ? ((currentExerciseIndex + 1) / sectionExercises.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span>
                      {currentExerciseIndex + 1} de {sectionExercises.length}
                    </span>
                  </div>
                  
                  <div className={`text-sm ${
                    autoSaveStatus === 'saving' ? 'text-yellow-500' : 
                    autoSaveStatus === 'error' ? 'text-red-500' : 
                    'text-gray-600'
                  }`}>
                    {autoSaveStatus === 'saving' ? 'Guardando...' : 
                     autoSaveStatus === 'error' ? 'Error al guardar' : 
                     'Guardado automáticamente'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Navigation */}
        <div className="w-12 flex items-center justify-center border-l border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              saveCurrentResponse();
              nextExercise();
            }}
            disabled={currentExerciseIndex >= sectionExercises.length - 1}
            className="p-2 hover:bg-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* BKT Progress */}
      <BKTProgress currentSectionId={currentSectionId} exercises={exercises} />

      {/* Bottom Shortcuts */}
      <div className="text-center p-2 text-xs text-gray-600 border-t border-gray-800">
        Ctrl+← Anterior • Ctrl+→ Siguiente • Esc Configuración
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsModal />}
      
      {/* Feedback Dialog */}
      <FeedbackDialog />
      
      {/* Section Transition Dialog */}
      <SectionTransitionDialog />
      
      {/* Rest Break Dialog */}
      <RestBreakDialog />
    </div>
  );
}