import React, { useState, useEffect } from "react";
import { ZipInput } from "./ZipInput";
import { WeatherWidget } from "./WeatherWidget";
import { ThemeEditorWidget } from "./ThemeEditorWidget";
import "./index.css";

const getApiUrl = (path: string) => {
  if (window.location.hostname === 'inky.princess-donut.com') {
    return `https://inky-server.princess-donut.com${path}`;
  }
  return `http://localhost:3011${path}`;
};

export function App() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple routing for snapshotting
  const queryParams = new URLSearchParams(window.location.search);
  const isSnapshot = window.location.pathname === "/snapshot";
  const snapshotZip = queryParams.get("zip") || "94110";
  const snapshotView = queryParams.get("view") || "current";
  const snapshotGradient = queryParams.get("gradient");
  const snapshotNoise = queryParams.get("noise") !== null ? parseFloat(queryParams.get("noise")!) : null;

  const [themeConfig, setThemeConfig] = useState<{
    gradient: string | null;
    noise: number;
    shadowX?: number;
    shadowY?: number;
    shadowBlur?: number;
    shadowOpacity?: number;
  }>({
    gradient: isSnapshot ? snapshotGradient : null,
    noise: isSnapshot && snapshotNoise !== null && !isNaN(snapshotNoise) ? snapshotNoise : 0.2,
    shadowX: queryParams.get("shadowX") !== null ? parseInt(queryParams.get("shadowX")!) : undefined,
    shadowY: queryParams.get("shadowY") !== null ? parseInt(queryParams.get("shadowY")!) : undefined,
    shadowBlur: queryParams.get("shadowBlur") !== null ? parseInt(queryParams.get("shadowBlur")!) : undefined,
    shadowOpacity: queryParams.get("shadowOpacity") !== null ? parseFloat(queryParams.get("shadowOpacity")!) : undefined,
  });

  const fetchWeather = async (zip: string, view: string = "current") => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl(`/weather?zip=${zip}&view=${view}`));
      if (!response.ok) throw new Error('Failed to fetch weather');
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWeather(isSnapshot ? snapshotZip : '94110', isSnapshot ? snapshotView : 'current');
  }, []);

  // Load first saved theme for snapshots if no custom query overrides are provided
  useEffect(() => {
    if (isSnapshot) {
      if (snapshotGradient !== null || snapshotNoise !== null) {
        setThemeConfig({
          gradient: snapshotGradient,
          noise: snapshotNoise !== null && !isNaN(snapshotNoise) ? snapshotNoise : 0.2,
          shadowX: queryParams.get("shadowX") !== null ? parseInt(queryParams.get("shadowX")!) : undefined,
          shadowY: queryParams.get("shadowY") !== null ? parseInt(queryParams.get("shadowY")!) : undefined,
          shadowBlur: queryParams.get("shadowBlur") !== null ? parseInt(queryParams.get("shadowBlur")!) : undefined,
          shadowOpacity: queryParams.get("shadowOpacity") !== null ? parseFloat(queryParams.get("shadowOpacity")!) : undefined,
        });
        return;
      }

      const loadFirstTheme = async () => {
        try {
          const response = await fetch(getApiUrl('/themes'));
          if (response.ok) {
            const themes = await response.json();
            if (themes.length > 0) {
              const firstTheme = themes[0];
              setThemeConfig({
                gradient: firstTheme.gradient,
                noise: firstTheme.noise,
                shadowX: firstTheme.shadow_x,
                shadowY: firstTheme.shadow_y,
                shadowBlur: firstTheme.shadow_blur,
                shadowOpacity: firstTheme.shadow_opacity,
              });
            }
          }
        } catch (err) {
          console.error('Failed to load first theme for snapshot:', err);
        }
      };
      loadFirstTheme();
    }
  }, [isSnapshot, snapshotGradient, snapshotNoise]);

  if (isSnapshot) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <WeatherWidget 
          data={weatherData} 
          loading={loading} 
          error={error} 
          themeOverride={themeConfig.gradient || undefined} 
          noiseLevel={themeConfig.noise}
          shadowX={themeConfig.shadowX}
          shadowY={themeConfig.shadowY}
          shadowBlur={themeConfig.shadowBlur}
          shadowOpacity={themeConfig.shadowOpacity}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-[800px]">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Weather</h1>
            <p className="opacity-50 text-sm">NestJS + React Dashboard</p>
          </div>
          <ZipInput onSearch={fetchWeather} loading={loading} />
        </header>

        <main className="flex flex-col items-center gap-12">
          <WeatherWidget 
            data={weatherData} 
            loading={loading} 
            error={error} 
            themeOverride={themeConfig.gradient || undefined} 
            noiseLevel={themeConfig.noise}
            shadowX={themeConfig.shadowX}
            shadowY={themeConfig.shadowY}
            shadowBlur={themeConfig.shadowBlur}
            shadowOpacity={themeConfig.shadowOpacity}
          />

          <div className="w-full flex flex-col items-center gap-6">
            <h2 className="text-xl font-semibold opacity-80">Theme Editor</h2>
            <ThemeEditorWidget onThemeChange={setThemeConfig} />
          </div>

          <div className="mt-8 text-[10px] opacity-20 uppercase tracking-[0.2em] font-bold">
            800 x 480 Display Optimized
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
