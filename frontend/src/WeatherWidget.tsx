import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js';

function useThemeContrast(themeOverride?: string) {
  if (!themeOverride) return { textColorClass: 'text-white drop-shadow-md', isLightBackground: false };
  try {
    const hexColors = themeOverride.match(/#[A-Fa-f0-9]{6}\b/g);
    if (hexColors && hexColors.length > 0) {
      const lum1 = chroma(hexColors[0]).luminance();
      const lum2 = hexColors.length > 1 ? chroma(hexColors[1]).luminance() : lum1;
      const avgLum = (lum1 + lum2) / 2;
      const isLightBackground = avgLum > 0.55; // Slightly higher threshold to prefer light text unless quite bright
      return {
        textColorClass: isLightBackground ? 'text-slate-900 drop-shadow-none' : 'text-white drop-shadow-md',
        isLightBackground
      };
    }
  } catch (e) {}
  return { textColorClass: 'text-white drop-shadow-md', isLightBackground: false };
}

interface WeatherWidgetProps {
  data: any;
  loading: boolean;
  error: string | null;
  themeOverride?: string;
  noiseLevel?: number;
}

export function WeatherWidget({ data, loading, error, themeOverride, noiseLevel = 0.2 }: WeatherWidgetProps) {
  if (loading) {
    return (
      <div className="w-[800px] h-[480px] bg-blue-500/20 rounded-[40px] flex items-center justify-center animate-pulse border border-white/10">
        <p className="text-2xl font-light text-white">Updating weather...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[800px] h-[480px] bg-red-500/20 rounded-[40px] flex items-center justify-center border border-red-500/20">
        <p className="text-xl text-white">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const view = data.view || 'current';

  if (view === 'today') return <TodayView data={data} themeOverride={themeOverride} noiseLevel={noiseLevel} />;
  if (view === 'forecast') return <ForecastView data={data} themeOverride={themeOverride} noiseLevel={noiseLevel} />;
  return <CurrentView data={data} themeOverride={themeOverride} noiseLevel={noiseLevel} />;
}

function GrainOverlay({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div 
      className="absolute inset-0 pointer-events-none mix-blend-overlay z-0"
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        opacity: opacity
      }}
    ></div>
  );
}

function CurrentView({ data, themeOverride, noiseLevel = 0 }: { data: any, themeOverride?: string, noiseLevel?: number }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { textColorClass, isLightBackground } = useThemeContrast(themeOverride);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds to keep it fairly fresh without over-rendering

    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const condition = data.weather?.[0]?.main?.toLowerCase() || 'clear';
  const gradient = getGradient(condition);

  return (
    <div 
      className={`w-[800px] h-[480px] ${!themeOverride ? `bg-gradient-to-br ${gradient}` : ''} rounded-[40px] p-10 ${textColorClass} shadow-2xl relative overflow-hidden border border-white/20 font-sans transition-all duration-300`}
      style={themeOverride ? { background: themeOverride } : {}}
    >
      <GrainOverlay opacity={noiseLevel} />
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="flex items-baseline gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight">{data.name}</h1>
            <span className="text-2xl font-semibold opacity-80">{formattedTime}</span>
          </div>
          <p className="text-8xl font-black tracking-tighter mt-2">{Math.round(data.main?.temp ?? data.temp)}°</p>
          <p className="text-xl opacity-90 font-bold capitalize mt-1">
            {data.weather?.[0]?.description}
          </p>
          <div className="flex gap-4 mt-2 opacity-80 font-bold">
            <span>H:{Math.round(data.main?.temp_max)}°</span>
            <span>L:{Math.round(data.main?.temp_min)}°</span>
          </div>
        </div>
        <div className="text-right">
          {data.weather?.[0]?.icon && (
            <img 
              src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`}
              alt="Weather Icon"
              className="w-40 h-40 mt-[-20px]"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-12 relative z-10">
        <StatModule label="FEELS LIKE" value={`${Math.round(data.main?.feels_like)}°`} subText="Similar to the actual temperature." isLightBackground={isLightBackground} />
        <StatModule label="HUMIDITY" value={`${data.main?.humidity}%`} subText={`The dew point is ${Math.round(data.main?.temp - 5)}° right now.`} isLightBackground={isLightBackground} />
        <StatModule label="WIND" value={`${Math.round(data.wind?.speed)}`} unit="m/s" subText="Moderate breeze expected today." isLightBackground={isLightBackground} />
        <StatModule label="PRESSURE" value={data.main?.pressure} unit="hPa" subText="Steady in the last hour." isLightBackground={isLightBackground} />
      </div>

      {data.message && <MockWarning message={data.message} />}
    </div>
  );
}

function TodayView({ data, themeOverride, noiseLevel = 0 }: { data: any, themeOverride?: string, noiseLevel?: number }) {
  // OWM forecast returns 3-hour steps. Let's take the first 8 (24 hours)
  const hourly = data.list?.slice(0, 8) || [];
  const current = hourly[0];
  const condition = current?.weather?.[0]?.main?.toLowerCase() || 'clear';
  const gradient = getGradient(condition);
  const { textColorClass, isLightBackground } = useThemeContrast(themeOverride);

  const itemBgClass = isLightBackground 
    ? 'bg-black/5 border-black/10 text-slate-800' 
    : 'bg-white/10 border-white/10 text-white';
  const progressTrackClass = isLightBackground ? 'bg-slate-200' : 'bg-white/20';
  const progressBarClass = isLightBackground ? 'bg-slate-700' : 'bg-white';

  return (
    <div 
      className={`w-[800px] h-[480px] ${!themeOverride ? `bg-gradient-to-br ${gradient}` : ''} rounded-[40px] p-8 ${textColorClass} shadow-2xl relative overflow-hidden border border-white/20 font-sans transition-all duration-300`}
      style={themeOverride ? { background: themeOverride } : {}}
    >
      <GrainOverlay opacity={noiseLevel} />
      <h1 className="text-3xl font-extrabold mb-6 relative z-10">{data.city?.name || 'Today'}'s Forecast</h1>

      <div className="grid grid-cols-8 gap-2 h-64 mb-6">
        {hourly.map((item: any, i: number) => (
          <div key={i} className={`${itemBgClass} backdrop-blur-md rounded-2xl p-2 flex flex-col items-center justify-between border relative z-10 transition-all duration-300`}>
            <p className="text-[10px] font-black opacity-60">
              {new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric' })}
            </p>
            <img 
              src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
              alt="icon"
              className="w-10 h-10"
            />
            <p className="text-lg font-black">{Math.round(item.main.temp)}°</p>
            <div className={`w-full ${progressTrackClass} h-1 rounded-full overflow-hidden mt-1`}>
              <div className={`${progressBarClass} h-full`} style={{ width: `${item.pop * 100}%` }}></div>
            </div>
            <p className="text-[8px] font-bold opacity-60">{Math.round(item.pop * 100)}%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 relative z-10">
        <StatModule label="FEELS LIKE" value={`${Math.round(current?.main?.feels_like)}°`} subText="Morning average." isLightBackground={isLightBackground} />
        <StatModule label="HUMIDITY" value={`${current?.main?.humidity}%`} subText="Next 24 hours." isLightBackground={isLightBackground} />
        <StatModule label="WIND" value={`${Math.round(current?.wind?.speed)}`} unit="m/s" subText="Max expected." isLightBackground={isLightBackground} />
        <StatModule label="PRECIP" value={`${Math.round(current?.pop * 100)}%`} subText="Peak chance." isLightBackground={isLightBackground} />
      </div>

      {data.message && <MockWarning message={data.message} />}
    </div>
  );
}

function ForecastView({ data, themeOverride, noiseLevel = 0 }: { data: any, themeOverride?: string, noiseLevel?: number }) {
  // Group forecast by day. OWM returns 40 items (5 days, every 3 hours)
  const daily = data.list ? data.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5) : [];
  const current = daily[0];
  const condition = current?.weather?.[0]?.main?.toLowerCase() || 'clear';
  const gradient = getGradient(condition);
  const { textColorClass, isLightBackground } = useThemeContrast(themeOverride);

  const itemBgClass = isLightBackground 
    ? 'bg-black/5 border-black/10 text-slate-800' 
    : 'bg-white/10 border-white/10 text-white';
  const barTrackClass = isLightBackground ? 'bg-slate-200' : 'bg-white/20';
  const barFillClass = isLightBackground ? 'bg-slate-700' : 'bg-white';
  const labelOpacityClass = isLightBackground ? 'opacity-50' : 'opacity-60';

  return (
    <div 
      className={`w-[800px] h-[480px] ${!themeOverride ? `bg-gradient-to-br ${gradient}` : ''} rounded-[40px] p-8 ${textColorClass} shadow-2xl relative overflow-hidden border border-white/20 font-sans transition-all duration-300`}
      style={themeOverride ? { background: themeOverride } : {}}
    >
      <GrainOverlay opacity={noiseLevel} />
      <h1 className="text-3xl font-extrabold mb-8 relative z-10">{data.city?.name || '5-Day'} Forecast</h1>
      
      <div className="space-y-3 relative z-10">
        {daily.map((day: any, i: number) => (
          <div key={i} className={`${itemBgClass} backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border transition-all duration-300`}>
            <div className="w-24">
              <p className="font-extrabold text-base">
                {i === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-1 justify-center">
              <img 
                src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                alt="icon"
                className="w-10 h-10"
              />
              <p className="text-sm font-bold opacity-80 w-32 capitalize">{day.weather[0].description}</p>
            </div>
            <div className="flex items-center gap-8 w-48 justify-end font-bold">
              <div className="flex items-center gap-2">
                <span className={`${labelOpacityClass} text-xs`}>LOW</span>
                <span>{Math.round(day.main.temp_min)}°</span>
              </div>
              <div className={`w-16 h-1.5 ${barTrackClass} rounded-full relative`}>
                <div className={`absolute inset-y-0 left-1/4 right-1/4 ${barFillClass} rounded-full`}></div>
              </div>
              <div className="flex items-center gap-2">
                <span>{Math.round(day.main.temp_max)}°</span>
                <span className={`${labelOpacityClass} text-xs`}>HIGH</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.message && <MockWarning message={data.message} />}
    </div>
  );
}

function getGradient(condition: string) {
  if (condition.includes('cloud')) return 'from-slate-400 to-slate-600';
  if (condition.includes('rain')) return 'from-blue-600 to-blue-900';
  if (condition.includes('clear')) return 'from-blue-400 to-blue-600';
  return 'from-blue-500 to-indigo-700';
}

function MockWarning({ message }: { message: string }) {
  return (
    <div className="absolute bottom-4 left-10 right-10 text-center">
      <p className="text-[10px] opacity-40 italic">{message}</p>
    </div>
  );
}

function StatModule({ label, value, unit, subText, isLightBackground = false }: { label: string, value: any, unit?: string, subText: string, isLightBackground?: boolean }) {
  const bgClass = isLightBackground 
    ? 'bg-black/5 border-black/10 text-slate-800' 
    : 'bg-white/10 border-white/10 text-white';
  const labelOpacityClass = isLightBackground ? 'opacity-50' : 'opacity-60';
  const textOpacityClass = isLightBackground ? 'opacity-70' : 'opacity-80';

  return (
    <div className={`${bgClass} backdrop-blur-md rounded-2xl p-4 border transition-all duration-300`}>
      <p className={`text-[10px] font-black ${labelOpacityClass} tracking-wider mb-2 uppercase`}>{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className={`text-sm font-semibold ${textOpacityClass}`}>{unit}</span>}
      </div>
      <p className={`text-[11px] mt-2 ${textOpacityClass} leading-tight line-clamp-2`}>{subText}</p>
    </div>
  );
}
