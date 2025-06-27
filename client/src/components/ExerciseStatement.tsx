import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MathRenderer } from './MathRenderer';

interface ExerciseStatementProps {
  className?: string;
}

export function ExerciseStatement({ className }: ExerciseStatementProps) {
  const { currentExercise } = useAppStore();

  if (!currentExercise) {
    return (
      <div className={`w-full mb-8 ${className || ''}`}>
        <div className="text-center text-gray-400 text-sm mb-3">
          <span>Cargando ejercicio...</span>
        </div>
        <div className="bg-gray-925 border border-gray-800 rounded-xl p-8 mb-6">
          <div className="text-lg leading-relaxed text-center text-gray-400">
            Selecciona una sección para comenzar
          </div>
        </div>
      </div>
    );
  }

  const displayText = currentExercise.ejercicio || currentExercise.enunciado;
  const topic = currentExercise.tema;

  return (
    <div className={`w-full mb-8 ${className || ''}`}>
      <div className="text-center text-gray-400 text-sm mb-3">
        <span>{topic}</span>
      </div>
      
      <div className="bg-gray-925 border border-gray-800 rounded-xl p-8 mb-6">
        <div className="text-lg leading-relaxed text-center">
          <MathRenderer content={displayText} displayMode />
        </div>
      </div>
    </div>
  );
}
