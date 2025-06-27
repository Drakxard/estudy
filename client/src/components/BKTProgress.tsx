import { useQuery } from '@tanstack/react-query';
import { Brain, Target, TrendingUp } from 'lucide-react';
import type { Exercise } from '@shared/schema';

interface BKTProgressProps {
  currentSectionId: number;
  exercises: Exercise[];
}

interface SectionDomain {
  sectionId: number;
  domain: string;
  topics: string[];
  difficulty: 'basico' | 'intermedio' | 'avanzado';
  progress: number;
  exerciseCount: number;
}

export function BKTProgress({ currentSectionId, exercises }: BKTProgressProps) {
  // Get real BKT data from server
  const { data: bktDomains } = useQuery<SectionDomain[]>({
    queryKey: ['/api/bkt/domains'],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Find current section's BKT data
  const currentDomain = bktDomains?.find(d => d.sectionId === currentSectionId) || {
    sectionId: currentSectionId,
    domain: 'Cargando...',
    difficulty: 'basico' as const,
    progress: 0,
    topics: [],
    exerciseCount: 0
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basico': return 'text-green-400';
      case 'intermedio': return 'text-yellow-400';
      case 'avanzado': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'basico': return <Target className="w-3 h-3" />;
      case 'intermedio': return <TrendingUp className="w-3 h-3" />;
      case 'avanzado': return <Brain className="w-3 h-3" />;
      default: return <Target className="w-3 h-3" />;
    }
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800 px-4 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-gray-400">
            <Brain className="w-3 h-3" />
            <span>BKT:</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="text-gray-300">{currentDomain.domain}</span>
          </div>
          
          <div className={`flex items-center space-x-1 ${getDifficultyColor(currentDomain.difficulty)}`}>
            {getDifficultyIcon(currentDomain.difficulty)}
            <span className="capitalize">{currentDomain.difficulty}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-gray-400">
            <span>Dominio:</span>
            <div className="w-16 bg-gray-700 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-500" 
                style={{ width: `${currentDomain.progress}%` }}
              />
            </div>
            <span className="text-gray-300 font-mono">{Math.round(currentDomain.progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}