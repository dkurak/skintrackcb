'use client';

// Sky icon based on cloud cover text
export function SkyIcon({ cloudCover, size = 'md' }: { cloudCover: string; size?: 'sm' | 'md' | 'lg' }) {
  const cover = cloudCover.toLowerCase();
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  if (cover.includes('clear') || cover.includes('sunny')) {
    // Sun
    return (
      <svg className={`${sizeClass} text-yellow-500`} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  if (cover.includes('partly') || cover.includes('few') || cover.includes('scattered')) {
    // Partial clouds
    return (
      <svg className={`${sizeClass} text-gray-500`} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="8" r="3" className="text-yellow-500" fill="currentColor" />
        <path d="M8 2v1M8 11v1M3 6H2M14 6h1M4.5 3.5l.7.7M11.5 3.5l-.7.7M4.5 8.5l.7-.7" stroke="currentColor" strokeWidth="1" fill="none" className="text-yellow-500" />
        <path d="M19 16a4 4 0 00-4-4h-.5a5.5 5.5 0 00-10.8 1.5A3.5 3.5 0 005 20h13a3 3 0 001-5.83z" className="text-gray-400" fill="currentColor" />
      </svg>
    );
  }

  if (cover.includes('mostly cloudy') || cover.includes('broken')) {
    // Mostly cloudy
    return (
      <svg className={`${sizeClass} text-gray-500`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 16a4 4 0 00-4-4h-.5a5.5 5.5 0 00-10.8 1.5A3.5 3.5 0 005 20h13a3 3 0 001-5.83z" />
      </svg>
    );
  }

  if (cover.includes('overcast') || cover.includes('cloudy')) {
    // Overcast (darker cloud)
    return (
      <svg className={`${sizeClass} text-gray-600`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 16a4 4 0 00-4-4h-.5a5.5 5.5 0 00-10.8 1.5A3.5 3.5 0 005 20h13a3 3 0 001-5.83z" />
        <path d="M13 9a3 3 0 00-3-3h-.3a4 4 0 00-7.8 1.1A2.5 2.5 0 003 12h9" className="text-gray-500" fill="currentColor" />
      </svg>
    );
  }

  // Default cloud
  return (
    <svg className={`${sizeClass} text-gray-400`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 16a4 4 0 00-4-4h-.5a5.5 5.5 0 00-10.8 1.5A3.5 3.5 0 005 20h13a3 3 0 001-5.83z" />
    </svg>
  );
}

// Wind direction arrow with intensity bars
export function WindIcon({ direction, speed, size = 'md' }: { direction: string; speed: string; size?: 'sm' | 'md' | 'lg' }) {
  // Determine intensity based on speed text
  const speedLower = speed.toLowerCase();
  let bars = 1; // light
  if (speedLower.includes('strong') || speedLower.includes('extreme') || speedLower.includes('high')) {
    bars = 3;
  } else if (speedLower.includes('moderate') || speedLower.includes('medium')) {
    bars = 2;
  }

  // Direction to rotation angle
  const directionAngles: Record<string, number> = {
    'N': 180, 'NNE': 202.5, 'NE': 225, 'ENE': 247.5,
    'E': 270, 'ESE': 292.5, 'SE': 315, 'SSE': 337.5,
    'S': 0, 'SSW': 22.5, 'SW': 45, 'WSW': 67.5,
    'W': 90, 'WNW': 112.5, 'NW': 135, 'NNW': 157.5,
  };

  const rotation = directionAngles[direction.toUpperCase()] ?? 0;

  // Color based on intensity
  const color = bars === 3 ? 'text-red-500' : bars === 2 ? 'text-orange-500' : 'text-gray-500';
  const arrowSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  const barHeight = size === 'sm' ? [6, 8, 10] : size === 'lg' ? [12, 16, 20] : [8, 11, 14];
  const barWidth = size === 'lg' ? 'w-1' : 'w-0.5';
  const gap = size === 'lg' ? 'gap-0.5' : 'gap-px';

  return (
    <div className={`flex items-center ${gap} ${color}`} title={`${direction} ${speed}`}>
      {/* Arrow showing wind direction */}
      <svg
        className={arrowSize}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <path d="M12 4l-6 8h4v8h4v-8h4z" />
      </svg>
      {/* Intensity bars */}
      <div className={`flex ${gap}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`${barWidth} rounded-sm ${i <= bars ? 'bg-current' : 'bg-gray-200'}`}
            style={{ height: `${barHeight[i - 1]}px` }}
          />
        ))}
      </div>
    </div>
  );
}
