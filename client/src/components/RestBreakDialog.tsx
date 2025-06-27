import { useAppStore } from '@/store/useAppStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

export function RestBreakDialog() {
  const {
    showRestBreak,
    restBreakMinutes,
    setShowRestBreak,
    resetTimer,
  } = useAppStore();

  const handleStartNewPomodoro = () => {
    setShowRestBreak(false);
    resetTimer();
  };

  const handleContinueStudying = () => {
    setShowRestBreak(false);
  };

  return (
    <Dialog open={showRestBreak} onOpenChange={setShowRestBreak}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-100 text-center text-2xl flex items-center justify-center gap-2">
            <Coffee className="w-6 h-6 text-amber-500" />
            ¡Tiempo de Descansar!
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Has completado tu sesión de estudio Pomodoro
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-500 mb-2">
              {restBreakMinutes} min
            </div>
            <p className="text-gray-300">
              Tiempo de descanso sugerido
            </p>
            <p className="text-sm text-gray-500 mt-1">
              (Minutos estudiados ÷ 5)
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleContinueStudying}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Seguir Estudiando
            </Button>
            
            <Button
              onClick={handleStartNewPomodoro}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Nuevo Pomodoro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}