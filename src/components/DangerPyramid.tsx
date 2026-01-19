'use client';

import { DangerLevel, DANGER_COLORS, DANGER_LABELS } from '@/types/forecast';

interface DangerPyramidProps {
  alpine: DangerLevel;
  treeline: DangerLevel;
  belowTreeline: DangerLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function DangerPyramid({
  alpine,
  treeline,
  belowTreeline,
  size = 'md',
}: DangerPyramidProps) {
  const dimensions = {
    sm: { width: 60, height: 52 },
    md: { width: 100, height: 87 },
    lg: { width: 140, height: 122 },
  };

  const { width, height } = dimensions[size];
  const fontSize = size === 'sm' ? 8 : size === 'md' ? 12 : 16;

  // Calculate the three horizontal sections of the pyramid
  const topY = 0;
  const midY = height * 0.33;
  const botY = height * 0.67;
  const baseY = height;

  // Width at each elevation
  const topWidth = width * 0.33;
  const midWidth = width * 0.67;
  const baseWidth = width;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="drop-shadow-sm"
    >
      {/* Alpine (top) */}
      <polygon
        points={`
          ${width / 2},${topY}
          ${width / 2 - topWidth / 2},${midY}
          ${width / 2 + topWidth / 2},${midY}
        `}
        fill={DANGER_COLORS[alpine]}
        stroke="#333"
        strokeWidth="1"
      />

      {/* Treeline (middle) */}
      <polygon
        points={`
          ${width / 2 - topWidth / 2},${midY}
          ${width / 2 - midWidth / 2},${botY}
          ${width / 2 + midWidth / 2},${botY}
          ${width / 2 + topWidth / 2},${midY}
        `}
        fill={DANGER_COLORS[treeline]}
        stroke="#333"
        strokeWidth="1"
      />

      {/* Below Treeline (bottom) */}
      <polygon
        points={`
          ${width / 2 - midWidth / 2},${botY}
          ${width / 2 - baseWidth / 2},${baseY}
          ${width / 2 + baseWidth / 2},${baseY}
          ${width / 2 + midWidth / 2},${botY}
        `}
        fill={DANGER_COLORS[belowTreeline]}
        stroke="#333"
        strokeWidth="1"
      />

      {/* Labels */}
      {size !== 'sm' && (
        <>
          <text
            x={width / 2}
            y={midY - (midY - topY) / 2 + fontSize / 3}
            textAnchor="middle"
            fontSize={fontSize}
            fill={alpine >= 4 ? '#fff' : '#000'}
            fontWeight="bold"
          >
            {alpine}
          </text>
          <text
            x={width / 2}
            y={botY - (botY - midY) / 2 + fontSize / 3}
            textAnchor="middle"
            fontSize={fontSize}
            fill={treeline >= 4 ? '#fff' : '#000'}
            fontWeight="bold"
          >
            {treeline}
          </text>
          <text
            x={width / 2}
            y={baseY - (baseY - botY) / 2 + fontSize / 3}
            textAnchor="middle"
            fontSize={fontSize}
            fill={belowTreeline >= 4 ? '#fff' : '#000'}
            fontWeight="bold"
          >
            {belowTreeline}
          </text>
        </>
      )}
    </svg>
  );
}

// Legend component for the pyramid
export function DangerPyramidLegend() {
  return (
    <div className="text-xs text-gray-600 mt-1">
      <div className="flex items-center gap-1">
        <span className="font-medium">ALP</span>
        <span className="text-gray-400">|</span>
        <span className="font-medium">TL</span>
        <span className="text-gray-400">|</span>
        <span className="font-medium">BTL</span>
      </div>
    </div>
  );
}
