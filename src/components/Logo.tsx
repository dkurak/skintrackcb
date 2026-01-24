'use client';

interface LogoProps {
  color?: string;
  size?: number;
  showText?: boolean;
  className?: string;
}

// Stacked Peaks logo - mountain range silhouette
export function Logo({ color = 'currentColor', size = 24, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size * 2}
        height={size}
        viewBox="0 0 128 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Main peak */}
        <path
          d="M8 48L24 16L40 48"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Second peak */}
        <path
          d="M40 48L56 24L72 48"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        {/* Third peak */}
        <path
          d="M72 48L84 32L96 48"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        {/* Ground line */}
        <rect x="8" y="54" width="88" height="2" fill={color} opacity="0.3" />
      </svg>
      {showText && (
        <span className="font-bold" style={{ fontSize: size * 0.75 }}>
          Backcountry Crews
        </span>
      )}
    </div>
  );
}

// Icon-only version for favicon and small spaces
export function LogoIcon({ color = 'currentColor', size = 32 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified peaks for icon use */}
      <path
        d="M8 52L22 20L36 52"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 52L42 28L56 52"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}
