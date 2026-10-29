import chroma from 'chroma-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const getApiUrl = (path: string) => {
  if (window.location.hostname === 'inky.princess-donut.com') {
    return `https://inky-server.princess-donut.com${path}`;
  }
  return `http://localhost:3011${path}`;
};

interface ThemeEditorWidgetProps {
  onThemeChange: (config: {
    gradient: string | null;
    noise: number;
    shadowX?: number;
    shadowY?: number;
    shadowBlur?: number;
    shadowOpacity?: number;
  }) => void;
}

interface SavedTheme {
  id: number;
  name: string;
  gradient: string | null;
  noise: number;
  shadow_x?: number;
  shadow_y?: number;
  shadow_blur?: number;
  shadow_opacity?: number;
}

const PRESET_COLORS = [
  '#FDE2E4', // Light Pink
  '#FFB7B2', // Pink
  '#FF9AA2', // Salmon
  '#FF6B6B', // Red
  '#FF8B3D', // Orange
  '#FFCC33', // Yellow
  '#00D2A0', // Teal/Green
  '#4D96FF', // Blue
  '#6B5B95', // Purple
  '#3D3D3D', // Dark Gray
];

export function ThemeEditorWidget({ onThemeChange }: ThemeEditorWidgetProps) {
  const [baseColor, setBaseColor] = useState<string>(PRESET_COLORS[1]); // Default to Pink
  const [customHue, setCustomHue] = useState<number | null>(null);
  const [colorCount, setColorCount] = useState<number>(3);
  const [saturation, setSaturation] = useState<number>(1.0); // 0 to 2
  const [lightness, setLightness] = useState<number>(1.0); // 0 to 2
  const [noiseLevel, setNoiseLevel] = useState<number>(0.2); // 0 to 1
  const [isAuto, setIsAuto] = useState(false);

  // Theme persistence states
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [themeName, setThemeName] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Text shadow configuration states
  const [shadowX, setShadowX] = useState<number>(0);
  const [shadowY, setShadowY] = useState<number>(2);
  const [shadowBlur, setShadowBlur] = useState<number>(4);
  const [shadowOpacity, setShadowOpacity] = useState<number>(0.35);

  // Dragging state for the color wheel
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const colors = useMemo(() => {
    if (isAuto) return [];

    // Apply saturation and lightness/value to base color
    const base = chroma(baseColor)
      .saturate(saturation - 1)
      .brighten(lightness - 1);

    const [originalH, s, l] = base.hsl();

    // Use custom hue if set, otherwise use original base color hue
    const h = customHue !== null ? customHue : Number.isNaN(originalH) ? 0 : originalH;

    const c1 = chroma.hsl(h, s, l).hex();
    if (colorCount === 1) return [{ hex: c1, hue: h, offset: 0 }];

    const c2Hue = (h + 150) % 360;
    const c2 = chroma.hsl(c2Hue, s, l).hex();

    if (colorCount === 2) {
      return [
        { hex: c1, hue: h, offset: 0 },
        { hex: c2, hue: c2Hue, offset: 150 },
      ];
    }

    const c3Hue = (h + 210) % 360;
    const c3 = chroma.hsl(c3Hue, s, l).hex();
    return [
      { hex: c1, hue: h, offset: 0 },
      { hex: c2, hue: c2Hue, offset: 150 },
      { hex: c3, hue: c3Hue, offset: 210 },
    ];
  }, [baseColor, customHue, colorCount, saturation, lightness, isAuto]);

  const gradientString = useMemo(() => {
    if (isAuto) return null;
    if (colors.length === 1) return colors[0].hex;
    return `linear-gradient(135deg, ${colors.map((c) => c.hex).join(', ')})`;
  }, [colors, isAuto]);

  useEffect(() => {
    onThemeChange({
      gradient: gradientString,
      noise: noiseLevel,
      shadowX,
      shadowY,
      shadowBlur,
      shadowOpacity,
    });
  }, [gradientString, noiseLevel, shadowX, shadowY, shadowBlur, shadowOpacity, onThemeChange]);

  // Handle color wheel dragging
  useEffect(() => {
    if (draggingIndex === null) return;

    const offsets = [0, 150, 210];
    const offset = offsets[draggingIndex] || 0;

    const handlePointerMove = (e: PointerEvent) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let angleDeg = (angleRad * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;

      // Calculate what the base hue should be based on the dragged circle's new angle
      const newBaseHue = (angleDeg - offset + 360) % 360;
      setCustomHue(newBaseHue);
    };

    const handlePointerUp = () => {
      setDraggingIndex(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingIndex]);

  // Load saved themes on mount
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch(getApiUrl('/themes'));
        if (response.ok) {
          const data = await response.json();
          setSavedThemes(data);
        }
      } catch (err) {
        console.error('Failed to fetch themes:', err);
      }
    };
    void fetchThemes();
  }, []);

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(getApiUrl('/themes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: themeName,
          gradient: gradientString,
          noise: noiseLevel,
          shadow_x: shadowX,
          shadow_y: shadowY,
          shadow_blur: shadowBlur,
          shadow_opacity: shadowOpacity,
        }),
      });

      if (response.ok) {
        const newTheme = await response.json();
        // Update saved themes list, replacing if name matches (due to upsert)
        setSavedThemes((prev) => {
          const filtered = prev.filter((t) => t.name !== newTheme.name);
          return [newTheme, ...filtered];
        });
        setSelectedThemeId(newTheme.id.toString());
        setThemeName('');
      }
    } catch (err) {
      console.error('Failed to save theme:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTheme = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedThemeId(id);
    if (!id) return;

    const theme = savedThemes.find((t) => t.id.toString() === id);
    if (theme) {
      if (theme.shadow_x !== undefined) setShadowX(theme.shadow_x);
      if (theme.shadow_y !== undefined) setShadowY(theme.shadow_y);
      if (theme.shadow_blur !== undefined) setShadowBlur(theme.shadow_blur);
      if (theme.shadow_opacity !== undefined) setShadowOpacity(theme.shadow_opacity);

      if (theme.gradient === null) {
        setIsAuto(true);
        setNoiseLevel(theme.noise);
      } else {
        setIsAuto(false);
        setNoiseLevel(theme.noise);
        const hexColors = theme.gradient.match(/#[A-Fa-f0-9]{6}\b/g) || [];
        if (hexColors.length > 0) {
          setBaseColor(hexColors[0]);
          setCustomHue(null);
          setColorCount(hexColors.length);
        }
      }
    }
  };

  return (
    <div className="w-[400px] bg-[#E8F3F2] rounded-[32px] p-6 shadow-xl border border-white/50 text-[#4A5568] font-sans">
      {/* Top Icons */}
      <div className="flex justify-center gap-6 mb-6">
        <button
          type="button"
          onClick={() => setIsAuto(true)}
          className={`p-2 rounded-xl transition-all ${isAuto ? 'bg-white/60 shadow-inner' : 'opacity-40 hover:opacity-100'}`}
        >
          <SparklesIcon />
        </button>
        <button
          type="button"
          onClick={() => setIsAuto(false)}
          className={`p-2 rounded-xl transition-all ${!isAuto ? 'bg-white/60 shadow-inner' : 'opacity-40 hover:opacity-100'}`}
        >
          <SunIcon />
        </button>
        <button type="button" className="p-2 rounded-xl opacity-20 cursor-not-allowed">
          <MoonIcon />
        </button>
      </div>

      {/* Preview Area */}
      <div
        ref={previewRef}
        className="relative h-64 rounded-2xl overflow-hidden mb-4 bg-white/40 shadow-inner border border-white/20 touch-none"
      >
        {/* Dot Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)',
            backgroundSize: '8px 8px',
          }}
        ></div>

        {/* Noise Overlay Preview */}
        {!isAuto && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              opacity: noiseLevel * 0.5, // scaled for preview
            }}
          ></div>
        )}

        {/* Floating circles representing colors */}
        {!isAuto && (
          <div className="absolute inset-0 flex items-center justify-center">
            {colors.map((c, i) => {
              const radius = 60; // Distance from center
              const x = Math.cos((c.hue * Math.PI) / 180) * radius;
              const y = Math.sin((c.hue * Math.PI) / 180) * radius;

              return (
                <div
                  key={`${c.hue}-${c.hex}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDraggingIndex(i);
                  }}
                  className={`absolute w-16 h-16 rounded-full shadow-lg border-4 border-white ease-out cursor-grab active:cursor-grabbing ${draggingIndex === i ? 'duration-75 scale-110' : 'duration-500'}`}
                  style={{
                    backgroundColor: c.hex,
                    transform: `translate(${x}px, ${y}px)`,
                    zIndex: colors.length - i,
                  }}
                />
              );
            })}
          </div>
        )}

        {isAuto && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40 italic text-sm">
            Automatic Weather Theme
          </div>
        )}

        {/* Plus/Minus Buttons */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
          <button
            type="button"
            onClick={() => setColorCount((prev) => Math.max(1, prev - 1))}
            className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shadow-sm hover:bg-white active:scale-95 transition-all text-lg font-bold"
            disabled={isAuto}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setColorCount((prev) => Math.min(3, prev + 1))}
            className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shadow-sm hover:bg-white active:scale-95 transition-all text-lg font-bold"
            disabled={isAuto}
          >
            +
          </button>
        </div>
      </div>

      {/* Swatches */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {PRESET_COLORS.map((color) => {
          const previewColor = chroma(color)
            .saturate(saturation - 1)
            .brighten(lightness - 1)
            .hex();
          return (
            <button
              type="button"
              key={color}
              onClick={() => {
                setBaseColor(color);
                setCustomHue(null);
                setIsAuto(false);
              }}
              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all ${baseColor === color && !isAuto ? 'border-white scale-125 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
              style={{ backgroundColor: previewColor }}
            />
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-3 mt-4">
        <Slider label="Saturation" value={saturation} min={0} max={2} onChange={setSaturation} />
        <Slider label="Value" value={lightness} min={0} max={2} onChange={setLightness} />
        <Slider label="Noise" value={noiseLevel} min={0} max={1} onChange={setNoiseLevel} />
      </div>

      {/* Text Shadow Controls */}
      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-black/5">
        <div className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mb-1">
          Text Shadow Config
        </div>
        <Slider label="Offset X" value={shadowX} min={-10} max={10} onChange={setShadowX} />
        <Slider label="Offset Y" value={shadowY} min={-10} max={10} onChange={setShadowY} />
        <Slider label="Blur" value={shadowBlur} min={0} max={20} onChange={setShadowBlur} />
        <Slider label="Opacity" value={shadowOpacity} min={0} max={1} onChange={setShadowOpacity} />
      </div>

      {/* Save & Load Themes */}
      <div className="mt-6 pt-6 border-t border-black/10 flex flex-col gap-4">
        {/* Load Theme */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="load-theme-select"
            className="text-[10px] font-bold opacity-40 uppercase tracking-tighter"
          >
            Load Saved Theme
          </label>
          <select
            id="load-theme-select"
            value={selectedThemeId}
            onChange={handleSelectTheme}
            className="w-full h-10 px-3 bg-white/40 border border-white/20 rounded-xl text-sm focus:outline-none focus:bg-white/70 transition-all text-[#4A5568]"
          >
            <option value="">-- Select Saved Theme --</option>
            {savedThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name} ({theme.gradient ? 'Custom' : 'Auto'})
              </option>
            ))}
          </select>
        </div>

        {/* Save Theme */}
        <form onSubmit={handleSaveTheme} className="flex flex-col gap-1">
          <label
            htmlFor="save-theme-name"
            className="text-[10px] font-bold opacity-40 uppercase tracking-tighter"
          >
            Save Current Theme
          </label>
          <div className="flex gap-2">
            <input
              id="save-theme-name"
              type="text"
              placeholder="e.g. Lavender Dusk"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="flex-1 h-10 px-3 bg-white/40 border border-white/20 rounded-xl text-sm focus:outline-none focus:bg-white/70 placeholder:text-gray-400 transition-all text-[#4A5568]"
            />
            <button
              type="submit"
              disabled={isSaving || !themeName.trim()}
              className="px-4 h-10 bg-white/60 hover:bg-white active:scale-95 disabled:opacity-40 disabled:scale-100 font-medium text-sm rounded-xl shadow-sm transition-all text-[#4A5568]"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 text-[10px] font-bold opacity-40 uppercase tracking-tighter">
        {label}
      </div>
      <div className="flex-1 h-8 bg-white/30 rounded-full relative overflow-hidden px-3 flex items-center group">
        <input
          type="range"
          min={min}
          max={max}
          step="0.01"
          value={value}
          onChange={(e) => onChange(Number.parseFloat(e.target.value))}
          className="w-full appearance-none bg-transparent cursor-pointer relative z-10 
            [&::-webkit-slider-runnable-track]:h-full
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:rounded-md
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-gray-100
            [&::-webkit-slider-thumb]:mt-[-8px]"
        />
      </div>
    </div>
  );
}

// Simple Icons
function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Sun</title>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Moon</title>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Sparkles</title>
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
      <path d="M5 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
    </svg>
  );
}
