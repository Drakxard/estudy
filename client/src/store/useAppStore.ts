import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exercise, Settings, Response } from '@shared/schema';
import { sortByNumericPrefix } from '@/utils/sort'
interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPomodoro: boolean;
}

interface AppState {
  // Current state
  currentSectionId: number;
  currentExerciseIndex: number;
  exercises: Exercise[];
  currentExercise: Exercise | null;
  currentResponse: string;
  responses: Record<number, string>; // exerciseId -> response
  // Mapa exerciseId → posición de cursor dentro del textarea
  lastCursorPos: Record<number, number>;
  // Acción para actualizar el mapa completo de posiciones
  setLastCursorPos: (positions: Record<number, number>) => void;
  uploadExerciseFiles: (files: File[]) => Promise<void>
  sectionFiles: string[];
  setSectionFiles: (files: string[]) => void;
  // Timer
  timer: TimerState;
  timerInterval: number | null;
  studyStartTime: number | null;

  // Settings
  settings: Settings | null;

  // UI state
  isSettingsOpen: boolean;
  isLoading: boolean;
  autoSaveStatus: 'saved' | 'saving' | 'error';
  showFeedbackDialog: boolean;
  showSectionTransition: boolean;
  sectionCountdown: number;
  showRestBreak: boolean;
  restBreakMinutes: number;

  // Actions
  setExercises: (exercises: Exercise[]) => void;
  loadExercises: () => Promise<void>;               // ← NUEVO método
  setCurrentSection: (sectionId: number) => void;
  setCurrentExercise: (index: number) => void;
  setCurrentResponse: (response: string) => void;
  saveResponse: (exerciseId: number, response: string) => void;
  loadResponse: (exerciseId: number) => string;
  nextExercise: () => void;
  previousExercise: () => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: (minutes?: number) => void;
  updateTimer: () => void;

   decrementTimer: () => void;
  // Settings actions
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  toggleSettings: () => void;

  // Auto-save
  setAutoSaveStatus: (status: 'saved' | 'saving' | 'error') => void;

  // Feedback and section transition
  setShowFeedbackDialog: (show: boolean) => void;
  startSectionTransition: () => void;
  cancelSectionTransition: () => void;

  // Rest break
  setShowRestBreak: (show: boolean) => void;
  
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSectionId: 1,
      currentExerciseIndex: 0,
      exercises: [],
      currentExercise: null,
      currentResponse: '',
      responses: {},
      // Inicialmente no hay posiciones de cursor guardadas:
      lastCursorPos: {},

      // Setter: reemplaza el mapa completo
      setLastCursorPos: (positions: Record<number, number>) => {
        set({ lastCursorPos: positions });
      },
      timer: {
        minutes: 25,
        seconds: 0,
        isRunning: false,
        isPomodoro: true,
      },
      timerInterval: null,
      studyStartTime: null,

      settings: null,

      isSettingsOpen: false,
      isLoading: false,
      autoSaveStatus: 'saved',
      showFeedbackDialog: false,
      showSectionTransition: false,
      sectionCountdown: 5,
      showRestBreak: false,
      restBreakMinutes: 5,
sectionFiles: [],
setSectionFiles: (files: string[]) => {
  const sorted = [...files].sort(sortByNumericPrefix);
  set({ sectionFiles: sorted });
},



      // Actions
      setExercises: (exercises) => {
      set({ exercises });
        const state = get();
        const currentExercises = exercises.filter(ex => ex.sectionId === state.currentSectionId);
        if (currentExercises.length > 0 && state.currentExerciseIndex < currentExercises.length) {
          set({ currentExercise: currentExercises[state.currentExerciseIndex] });
        }
      },
      
      setCurrentSection: (sectionId) => {
        const state = get();
        const sectionExercises = state.exercises.filter(ex => ex.sectionId === sectionId);
        // Sort exercises by order to ensure proper sequence
        sectionExercises.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Load saved response for first exercise of new section
        const savedResponse = sectionExercises[0] ? state.loadResponse(sectionExercises[0].id) : '';
        
        set({
          currentSectionId: sectionId,
          currentExerciseIndex: 0,
          currentExercise: sectionExercises[0] || null,
          currentResponse: savedResponse,
        });
      },
      

 
      uploadExerciseFiles: async (files: File[]) => {
        for (const file of files) {
          if (!file.name.endsWith('.js')) continue;
          const content = await file.text();
          const res = await fetch('/api/sections/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, content }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Error subiendo ${file.name}: ${err.error || res.statusText}`);
          }
        }

        // 3) Recuperar la lista cruda
        const filesList: string[] = await fetch('/api/sections/files')
          .then(r => r.json());

        // 4) Guardarla ordenada en el store
        get().setSectionFiles(filesList);
      },



      setCurrentExercise: (index) => {
        const state = get();
        const sectionExercises = state.exercises.filter(ex => ex.sectionId === state.currentSectionId);
        if (index >= 0 && index < sectionExercises.length) {
          // Load saved response for the exercise
          const savedResponse = state.loadResponse(sectionExercises[index].id);
          
          set({
            currentExerciseIndex: index,
            currentExercise: sectionExercises[index],
            currentResponse: savedResponse,
          });
        }
      },
      
      setCurrentResponse: (response) => {
        set({ currentResponse: response });
      },
      
      saveResponse: (exerciseId, response) => {
        set(state => ({
          responses: { ...state.responses, [exerciseId]: response }
        }));
      },
      
      loadResponse: (exerciseId) => {
        const state = get();
        return state.responses[exerciseId] || '';
      },
      
      nextExercise: () => {
        const state = get();
        const sectionExercises = state.exercises.filter(ex => ex.sectionId === state.currentSectionId);
        const nextIndex = state.currentExerciseIndex + 1;
        
        // Save current response before moving (only save to local state, API call handled by component)
        if (state.currentExercise && state.currentResponse.trim()) {
          state.saveResponse(state.currentExercise.id, state.currentResponse);
        }
        
        if (nextIndex < sectionExercises.length) {
          // Load saved response for next exercise
          const savedResponse = state.loadResponse(sectionExercises[nextIndex].id);
          
          set({
            currentExerciseIndex: nextIndex,
            currentExercise: sectionExercises[nextIndex],
            currentResponse: savedResponse,
          });
        } else {
          // End of section - start countdown with feedback option
          state.startSectionTransition();
        }
      },
      
      previousExercise: () => {
        const state = get();
        const sectionExercises = state.exercises.filter(ex => ex.sectionId === state.currentSectionId);
        const prevIndex = state.currentExerciseIndex - 1;
        
        // Save current response before moving (only save to local state, API call handled by component)
        if (state.currentExercise && state.currentResponse.trim()) {
          state.saveResponse(state.currentExercise.id, state.currentResponse);
        }
        
        if (prevIndex >= 0) {
          // Load saved response for previous exercise
          const savedResponse = state.loadResponse(sectionExercises[prevIndex].id);
          
          set({
            currentExerciseIndex: prevIndex,
            currentExercise: sectionExercises[prevIndex],
            currentResponse: savedResponse,
          });
        }
      },



      // Timer actions
startTimer: () => {
  const state = get();
  if (state.timerInterval) return; // Ya está corriendo
  
  const timerMinutes = state.settings?.pomodoroMinutes || 25;
  set({
    timer: {
      minutes: timerMinutes,
      seconds: 0,
      isRunning: true,
      isPomodoro: true,
    },
    studyStartTime: Date.now()
  });
  
  const intervalId = window.setInterval(() => {
    get().updateTimer();
  }, 1000);
  
  set({ timerInterval: intervalId });
},

pauseTimer: () => {
  const state = get();
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    set({ timerInterval: null });
  }
  set(state => ({
    timer: { ...state.timer, isRunning: false }
  }));


},

resetTimer: (minutes) => {
  const state = get();
  // 1. Limpio cualquier intervalo anterior
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    set({ timerInterval: null });
  }

  // 2. Calculo los minutos iniciales
  const timerMinutes = minutes ?? state.settings?.pomodoroMinutes ?? 25;

  // 3. Reinicio el timer en marcha
  set({
    timer: {
      minutes: timerMinutes,
      seconds: 0,
      isRunning: true,
      isPomodoro: true,
    }
  });

  // 4. **Arranco** un nuevo intervalo de decremento
  const id = window.setInterval(() => {
    get().decrementTimer();
  }, 1000);
  set({ timerInterval: id });
},


updateTimer: () => {
  set(state => {
    if (!state.timer.isRunning) return state;
    
    if (state.timer.seconds === 0) {
      if (state.timer.minutes === 0) {
        // Timer terminó: calculamos tiempo de descanso
        const studyTime = state.studyStartTime
          ? (Date.now() - state.studyStartTime) / 60000
          : 25;
        const restMinutes = Math.ceil(studyTime / 5);
        
        // Limpiamos intervalo
        if (state.timerInterval) {
          clearInterval(state.timerInterval);
        }
        
        return {
          ...state,
          timer: { ...state.timer, isRunning: false },
          timerInterval: null,
          showRestBreak: true,
          restBreakMinutes: restMinutes
        };
      }
      return {
        ...state,
        timer: {
          ...state.timer,
          minutes: state.timer.minutes - 1,
          seconds: 59,
        }
      };
    } else {
      return {
        ...state,
        timer: {
          ...state.timer,
          seconds: state.timer.seconds - 1,
        }
      };
    }
  });
},
  decrementTimer: () => {
    const state = get(); 
    state.updateTimer();
  },  

// Settings actions
setSettings: (settings) => {
  set({ settings });
  if (settings.pomodoroMinutes) {
    const state = get();
    if (state.timer.isPomodoro) {
      set({
        timer: {
          ...state.timer,
          minutes: settings.pomodoroMinutes,
          seconds: 0,
        }
      });
    }
  }
},

      updateSettings: (updates) => {
        set(state => ({
          settings: state.settings ? { ...state.settings, ...updates } : null
        }));
      },
      
      toggleSettings: () => {
        set(state => ({ isSettingsOpen: !state.isSettingsOpen }));
      },
      
      setAutoSaveStatus: (status) => {
        set({ autoSaveStatus: status });
      },
      
      setShowFeedbackDialog: (show) => {
        set({ showFeedbackDialog: show });
      },
      
      startSectionTransition: () => {
        set({ 
          showSectionTransition: true, 
          sectionCountdown: 5 
        });
        
        const countdownInterval = setInterval(() => {
          const currentState = get();
          if (currentState.sectionCountdown <= 1) {
            // Countdown finished - move to next section
            clearInterval(countdownInterval);
            const nextSectionId = currentState.currentSectionId + 1;
            const maxSection = currentState.exercises.length > 0 ? Math.max(...currentState.exercises.map(ex => ex.sectionId)) : 1;
            
            if (nextSectionId <= maxSection) {
              // Check if next section has exercises
              const newSectionExercises = currentState.exercises.filter(ex => ex.sectionId === nextSectionId);
              if (newSectionExercises.length > 0) {
                // Sort exercises by order within the section
                newSectionExercises.sort((a, b) => (a.order || 0) - (b.order || 0));
                const savedResponse = currentState.loadResponse(newSectionExercises[0].id);
                
                set({
                  currentSectionId: nextSectionId,
                  currentExerciseIndex: 0,
                  currentExercise: newSectionExercises[0],
                  currentResponse: savedResponse,
                  showSectionTransition: false,
                  sectionCountdown: 5,
                });
                
                console.log(`Advanced to Section ${nextSectionId} with ${newSectionExercises.length} exercises`);
              } else {
                // No exercises in next section, try the one after
                console.log(`Section ${nextSectionId} has no exercises, checking next section`);
                const followingSectionId = nextSectionId + 1;
                if (followingSectionId <= maxSection) {
                  const followingSectionExercises = currentState.exercises.filter(ex => ex.sectionId === followingSectionId);
                  if (followingSectionExercises.length > 0) {
                    followingSectionExercises.sort((a, b) => (a.order || 0) - (b.order || 0));
                    const savedResponse = currentState.loadResponse(followingSectionExercises[0].id);
                    
                    set({
                      currentSectionId: followingSectionId,
                      currentExerciseIndex: 0,
                      currentExercise: followingSectionExercises[0],
                      currentResponse: savedResponse,
                      showSectionTransition: false,
                      sectionCountdown: 5,
                    });
                  }
                } else {
                  // No more sections
                  set({
                    showSectionTransition: false,
                    sectionCountdown: 5,
                  });
                }
              }
            } else {
              // No more sections - hide transition
              set({
                showSectionTransition: false,
                sectionCountdown: 5,
              });
              console.log('Completed all sections');
            }
          } else {
            set({ sectionCountdown: currentState.sectionCountdown - 1 });
          }
        }, 1000);
      },
      cancelSectionTransition: () => {
        set({ 
          showSectionTransition: false,
          sectionCountdown: 5,
          showFeedbackDialog: true 
        });
      },
      
      setShowRestBreak: (show) => {
        set({ showRestBreak: show });
      },
    }),
    {
      name: 'math-study-store',
      partialize: (state) => ({
        currentSectionId: state.currentSectionId,
        currentExerciseIndex: state.currentExerciseIndex,
        responses: state.responses,
        settings: state.settings,
        timer: state.timer,
        lastCursorPos: state.lastCursorPos,
      }),
    }
  )
);
