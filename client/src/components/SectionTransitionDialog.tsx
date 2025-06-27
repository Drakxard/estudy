import { useAppStore } from '@/store/useAppStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SectionTransitionDialog() {
  const {
    showSectionTransition,
    sectionCountdown,
    currentSectionId,
    cancelSectionTransition,
    exercises,
    setCurrentSection,
    setCurrentExercise,
    setCurrentResponse,
    loadResponse,
  } = useAppStore();

  const advanceToNextSection = () => {
    const nextSectionId = currentSectionId + 1;
    const maxSection = exercises.length > 0 ? Math.max(...exercises.map(ex => ex.sectionId)) : 1;
    
    if (nextSectionId <= maxSection) {
      const newSectionExercises = exercises.filter(ex => ex.sectionId === nextSectionId);
      if (newSectionExercises.length > 0) {
        newSectionExercises.sort((a, b) => (a.order || 0) - (b.order || 0));
        const savedResponse = loadResponse(newSectionExercises[0].id);
        
        setCurrentSection(nextSectionId);
        setCurrentExercise(0);
        setCurrentResponse(savedResponse);
        
        // Close transition dialog
        useAppStore.setState({ 
          showSectionTransition: false, 
          sectionCountdown: 5 
        });
      }
    }
  };

  const nextSectionId = currentSectionId + 1;
  const maxSection = exercises.length > 0 ? Math.max(...exercises.map(ex => ex.sectionId)) : 1;
  const hasNextSection = nextSectionId <= maxSection;

  return (
    <Dialog open={showSectionTransition} onOpenChange={() => {}}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-100 text-center text-2xl">
            ¡Sección {currentSectionId} Completada!
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            {hasNextSection 
              ? `Iniciando Sección ${nextSectionId} en:`
              : 'Has completado todas las secciones disponibles'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-8">
          {hasNextSection && (
            <div className="text-6xl font-bold text-blue-400 animate-pulse">
              {sectionCountdown}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={cancelSectionTransition}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              ¿Feedback?
            </Button>
            
            {hasNextSection && (
              <Button
                onClick={advanceToNextSection}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continuar
              </Button>
            )}
          </div>

          {!hasNextSection && (
            <Button
              onClick={cancelSectionTransition}
              className="bg-green-600 hover:bg-green-700"
            >
              Ver Feedback Final
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}