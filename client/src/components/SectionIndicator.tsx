import { useAppStore } from '@/store/useAppStore';

interface SectionIndicatorProps {
  className?: string;
}

export function SectionIndicator({ className }: SectionIndicatorProps) {
  const { currentSectionId, exercises } = useAppStore();

  // Calculate total sections
  const totalSections = exercises.length > 0 
    ? Math.max(...exercises.map(ex => ex.sectionId))
    : 8; // Default fallback

  return (
    <div className={`px-3 py-1 bg-gray-925 rounded-lg border border-gray-800 ${className || ''}`}>
      <span>Sección {currentSectionId}/{totalSections}</span>
    </div>
  );
}
