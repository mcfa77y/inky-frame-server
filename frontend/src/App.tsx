import React, { useState, useEffect } from "react";
import { ZipInput } from "./ZipInput";
import { WeatherWidget } from "./WeatherWidget";
import "./index.css";

export function App() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple routing for snapshotting
  const queryParams = new URLSearchParams(window.location.search);
  const isSnapshot = window.location.pathname === "/snapshot";
  const snapshotZip = queryParams.get("zip") || "94110";
  const snapshotView = queryParams.get("view") || "current";

  const fetchWeather = async (zip: string, view: string = "current") => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/weather?zip=${zip}&view=${view}`);
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

  if (isSnapshot) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <WeatherWidget data={weatherData} loading={loading} error={error} />
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

        <main className="flex flex-col items-center">
          <WeatherWidget data={weatherData} loading={loading} error={error} />
          
          <div className="mt-8 text-[10px] opacity-20 uppercase tracking-[0.2em] font-bold">
            800 x 480 Display Optimized
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
