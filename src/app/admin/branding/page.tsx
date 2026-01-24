'use client';

import { useTheme, themes, ThemeName } from '@/lib/theme';
import Link from 'next/link';

// Logo concept SVG components
function LogoSkinTracks({ color = 'currentColor', size = 64 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Three converging skin tracks meeting at a peak */}
      <path
        d="M32 8L16 56"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M32 8L32 56"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M32 8L48 56"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Small peak accent at convergence */}
      <circle cx="32" cy="8" r="4" fill={color} />
    </svg>
  );
}

function LogoWordmarkPeak({ color = 'currentColor', size = 64 }: { color?: string; size?: number }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 128 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stylized "BC" with peak on the A of BACKCOUNTRY - simplified here as abstract peaks */}
      <path
        d="M8 48L24 16L40 48"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 48L56 24L72 48"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M72 48L84 32L96 48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      {/* Text would go below */}
      <rect x="8" y="54" width="88" height="2" fill={color} opacity="0.3" />
    </svg>
  );
}

function LogoCompassMountain({ color = 'currentColor', size = 64 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer compass ring */}
      <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="2" opacity="0.3" />
      {/* Cardinal points */}
      <circle cx="32" cy="6" r="2" fill={color} />
      <circle cx="32" cy="58" r="2" fill={color} opacity="0.5" />
      <circle cx="6" cy="32" r="2" fill={color} opacity="0.5" />
      <circle cx="58" cy="32" r="2" fill={color} opacity="0.5" />
      {/* Mountain inside */}
      <path
        d="M16 44L28 24L32 30L36 24L48 44"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snow cap */}
      <path
        d="M26 28L28 24L30 27"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

function LogoMinimalPeaks({ color = 'currentColor', size = 64 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Three peaks - could subtly form "BC" */}
      <path
        d="M4 52L20 20L28 32L32 16L36 32L44 20L60 52"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandingPage() {
  const { theme, colors, setTheme } = useTheme();

  const themeKeys = Object.keys(themes) as ThemeName[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand & Theme</h1>
          <p className="text-gray-500">Preview themes and logo concepts</p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Theme Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Theme</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select a theme to preview. Changes apply site-wide immediately.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {themeKeys.map((key) => {
            const t = themes[key];
            const isActive = theme === key;

            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ background: t.primary.from }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ background: t.secondary.from }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ background: t.accent }}
                  />
                </div>
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                {isActive && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme Preview</h2>
        <p className="text-sm text-gray-500 mb-6">
          How the main CTA cards look with the current theme.
        </p>

        <div className="grid gap-3 max-w-md">
          <div
            className="rounded-xl p-4"
            style={{
              background: `linear-gradient(to right, ${colors.primary.from}, ${colors.primary.to})`,
              color: colors.primary.text,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏔️</span>
              <div>
                <div className="font-bold">Check Forecast</div>
                <div className="text-sm" style={{ color: colors.primary.subtext }}>
                  Avalanche conditions
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: `linear-gradient(to right, ${colors.secondary.from}, ${colors.secondary.to})`,
              color: colors.secondary.text,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛷️</span>
              <div>
                <div className="font-bold">Find a Trip</div>
                <div className="text-sm" style={{ color: colors.secondary.subtext }}>
                  Browse adventures
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: `linear-gradient(to right, ${colors.tertiary.from}, ${colors.tertiary.to})`,
              color: colors.tertiary.text,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <div className="font-bold">Find Partners</div>
                <div className="text-sm" style={{ color: colors.tertiary.subtext }}>
                  Connect with buddies
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Concepts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Concepts</h2>
        <p className="text-sm text-gray-500 mb-6">
          Exploratory logo ideas for &quot;Backcountry Crews&quot;. These are rough concepts to evaluate direction.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Concept 1: Converging Skin Tracks */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">1. Converging Tracks</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Three skin tracks meeting at a summit - represents crews coming together.
              Unique to ski touring culture.
            </p>
            <div className="flex items-center gap-6 py-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <LogoSkinTracks color="#ffffff" size={48} />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <LogoSkinTracks color="#1f2937" size={48} />
              </div>
              <div className="p-4 rounded-lg" style={{ background: colors.primary.from }}>
                <LogoSkinTracks color="#ffffff" size={48} />
              </div>
            </div>
          </div>

          {/* Concept 3: Wordmark with Peak */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">2. Stacked Peaks Wordmark</h3>
            <p className="text-sm text-gray-500 mb-4">
              Mountain range silhouette that could accompany the text wordmark.
              Works as a standalone icon too.
            </p>
            <div className="flex items-center gap-6 py-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <LogoWordmarkPeak color="#ffffff" size={48} />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <LogoWordmarkPeak color="#1f2937" size={48} />
              </div>
              <div className="p-4 rounded-lg" style={{ background: colors.primary.from }}>
                <LogoWordmarkPeak color="#ffffff" size={48} />
              </div>
            </div>
          </div>

          {/* Concept 4: Compass + Mountain */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">3. Compass Mountain</h3>
            <p className="text-sm text-gray-500 mb-4">
              Navigation meets wilderness - compass ring with mountain silhouette inside.
              Suggests adventure and direction.
            </p>
            <div className="flex items-center gap-6 py-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <LogoCompassMountain color="#ffffff" size={48} />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <LogoCompassMountain color="#1f2937" size={48} />
              </div>
              <div className="p-4 rounded-lg" style={{ background: colors.primary.from }}>
                <LogoCompassMountain color="#ffffff" size={48} />
              </div>
            </div>
          </div>

          {/* Minimal Peaks */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">4. Minimal Peaks</h3>
            <p className="text-sm text-gray-500 mb-4">
              Simple continuous line forming a mountain range.
              Clean, modern, works at any size.
            </p>
            <div className="flex items-center gap-6 py-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <LogoMinimalPeaks color="#ffffff" size={48} />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <LogoMinimalPeaks color="#1f2937" size={48} />
              </div>
              <div className="p-4 rounded-lg" style={{ background: colors.primary.from }}>
                <LogoMinimalPeaks color="#ffffff" size={48} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Notes</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>These are rough SVG concepts - a final logo would be professionally refined</li>
          <li>The &quot;Converging Tracks&quot; concept is unique to ski touring and memorable</li>
          <li>Consider how it looks as a favicon (16x16) and on a sticker</li>
          <li>Theme selection is saved to your browser - others will see the default until you set a site-wide default</li>
        </ul>
      </div>
    </div>
  );
}
