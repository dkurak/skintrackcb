'use client';

import { AspectElevationRose, ASPECTS, Aspect } from '@/types/forecast';

interface AspectRoseProps {
  rose: AspectElevationRose;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function AspectRose({ rose, size = 'md', showLabels = true }: AspectRoseProps) {
  const dimensions = {
    sm: 50,
    md: 80,
    lg: 120,
  };

  const dim = dimensions[size];
  const center = dim / 2;
  const outerRadius = dim / 2 - 4;
  const middleRadius = outerRadius * 0.67;
  const innerRadius = outerRadius * 0.33;

  // Colors for affected/not affected
  const affectedColor = '#6B7280'; // Gray for problem areas
  const borderColor = '#1F2937'; // Dark border for all lines
  const gridColor = '#1F2937'; // Dark border for grid lines (matches CBAC)

  // Calculate wedge paths for each aspect and elevation band
  const getWedgePath = (
    aspect: Aspect,
    radiusOuter: number,
    radiusInner: number
  ): string => {
    const aspectIndex = ASPECTS.indexOf(aspect);
    const angleStart = (aspectIndex * 45 - 22.5 - 90) * (Math.PI / 180);
    const angleEnd = (aspectIndex * 45 + 22.5 - 90) * (Math.PI / 180);

    const x1 = center + radiusInner * Math.cos(angleStart);
    const y1 = center + radiusInner * Math.sin(angleStart);
    const x2 = center + radiusOuter * Math.cos(angleStart);
    const y2 = center + radiusOuter * Math.sin(angleStart);
    const x3 = center + radiusOuter * Math.cos(angleEnd);
    const y3 = center + radiusOuter * Math.sin(angleEnd);
    const x4 = center + radiusInner * Math.cos(angleEnd);
    const y4 = center + radiusInner * Math.sin(angleEnd);

    return `M ${x1} ${y1} L ${x2} ${y2} A ${radiusOuter} ${radiusOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${radiusInner} ${radiusInner} 0 0 0 ${x1} ${y1}`;
  };

  const getLabelPosition = (aspect: Aspect) => {
    const aspectIndex = ASPECTS.indexOf(aspect);
    const angle = (aspectIndex * 45 - 90) * (Math.PI / 180);
    const labelRadius = outerRadius + 8;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle) + 3,
    };
  };

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="drop-shadow-sm">
      {/* Background grid lines for compass structure */}
      {ASPECTS.map((aspect) => (
        <g key={`grid-${aspect}`}>
          <path
            d={getWedgePath(aspect, outerRadius, middleRadius)}
            fill="none"
            stroke={gridColor}
            strokeWidth="0.5"
          />
          <path
            d={getWedgePath(aspect, middleRadius, innerRadius)}
            fill="none"
            stroke={gridColor}
            strokeWidth="0.5"
          />
          <path
            d={getWedgePath(aspect, innerRadius, 0)}
            fill="none"
            stroke={gridColor}
            strokeWidth="0.5"
          />
        </g>
      ))}

      {/* Filled areas for problems */}
      {ASPECTS.map((aspect) => {
        const data = rose[aspect];
        return (
          <g key={aspect}>
            {/* Below Treeline (outer ring) - only render if affected */}
            {data.below_treeline && (
              <path
                d={getWedgePath(aspect, outerRadius, middleRadius)}
                fill={affectedColor}
                stroke={borderColor}
                strokeWidth="1"
              />
            )}
            {/* Treeline (middle ring) - only render if affected */}
            {data.treeline && (
              <path
                d={getWedgePath(aspect, middleRadius, innerRadius)}
                fill={affectedColor}
                stroke={borderColor}
                strokeWidth="1"
              />
            )}
            {/* Alpine (inner ring / center) - only render if affected */}
            {data.alpine && (
              <path
                d={getWedgePath(aspect, innerRadius, 0)}
                fill={affectedColor}
                stroke={borderColor}
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}

      {/* Aspect labels */}
      {showLabels && size !== 'sm' && (
        <>
          {ASPECTS.map((aspect) => {
            const pos = getLabelPosition(aspect);
            return (
              <text
                key={`label-${aspect}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fontSize={size === 'lg' ? 10 : 8}
                fill="#666"
                fontWeight="medium"
              >
                {aspect}
              </text>
            );
          })}
        </>
      )}
    </svg>
  );
}

// Empty rose for display
export const EMPTY_ROSE: AspectElevationRose = {
  N: { alpine: false, treeline: false, below_treeline: false },
  NE: { alpine: false, treeline: false, below_treeline: false },
  E: { alpine: false, treeline: false, below_treeline: false },
  SE: { alpine: false, treeline: false, below_treeline: false },
  S: { alpine: false, treeline: false, below_treeline: false },
  SW: { alpine: false, treeline: false, below_treeline: false },
  W: { alpine: false, treeline: false, below_treeline: false },
  NW: { alpine: false, treeline: false, below_treeline: false },
};
