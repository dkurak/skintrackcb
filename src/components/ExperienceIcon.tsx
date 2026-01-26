import { ExperienceLevel } from '@/lib/constants';

interface ExperienceIconProps {
  level: ExperienceLevel;
  size?: 'sm' | 'lg';
}

export function ExperienceIcon({ level, size = 'sm' }: ExperienceIconProps) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  switch (level) {
    case 'beginner':
      // Green circle
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" className="text-green-500" />
        </svg>
      );
    case 'intermediate':
      // Blue square
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" className="text-blue-500" />
        </svg>
      );
    case 'advanced':
      // Black diamond (white fill for visibility on dark bg)
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="white">
          <path d="M12 2L22 12L12 22L2 12L12 2Z" />
        </svg>
      );
    case 'expert':
      // Double black diamond (two side-by-side diamonds)
      return (
        <span className="inline-flex gap-0.5">
          <svg className={sizeClass} viewBox="0 0 24 24" fill="white">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" />
          </svg>
          <svg className={sizeClass} viewBox="0 0 24 24" fill="white">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" />
          </svg>
        </span>
      );
  }
}
