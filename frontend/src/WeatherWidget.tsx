import React from 'react';

interface WeatherWidgetProps {
  data: any;
  loading: boolean;
  error: string | null;
}

export function WeatherWidget({ data, loading, error }: WeatherWidgetProps) {
  if (loading) {
    return (
      <div className="w-[800px] h-[480px] bg-blue-500/20 rounded-[40px] flex items-center justify-center animate-pulse border border-white/10">
        <p className="text-2xl font-light">Updating weather...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[800px] h-[480px] bg-red-500/20 rounded-[40px] flex items-center justify-center border border-red-500/20">
        <p className="text-xl">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  // Derive styles based on condition
  const condition = data.weather?.[0]?.main?.toLowerCase() || 'clear';
  const getGradient = () => {
    if (condition.includes('cloud')) return 'from-slate-400 to-slate-600';
    if (condition.includes('rain')) return 'from-blue-600 to-blue-900';
    if (condition.includes('clear')) return 'from-blue-400 to-blue-600';
    return 'from-blue-500 to-indigo-700';
  };

  return (
    <div className={`w-[800px] h-[480px] bg-gradient-to-br ${getGradient()} rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden border border-white/20 font-sans`}>
      {/* Decorative Blur Circle */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

      {/* Header Info */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">{data.name}</h1>
          <p className="text-7xl font-light mt-2">{Math.round(data.main?.temp ?? data.temp)}°</p>
          <p className="text-xl opacity-90 font-medium capitalize mt-1">
            {data.weather?.[0]?.description}
          </p>
          <div className="flex gap-4 mt-2 opacity-80 font-medium">
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

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mt-12 relative z-10">
        <StatModule label="FEELS LIKE" value={`${Math.round(data.main?.feels_like)}°`} subText="Similar to the actual temperature." />
        <StatModule label="HUMIDITY" value={`${data.main?.humidity}%`} subText={`The dew point is ${Math.round(data.main?.temp - 5)}° right now.`} />
        <StatModule label="WIND" value={`${Math.round(data.wind?.speed)}`} unit="MPH" subText="Gusts up to 15 mph." />
        <StatModule label="PRESSURE" value={data.main?.pressure} unit="hPa" subText="Steady in the last hour." />
      </div>

      {/* Mock API Warning */}
      {data.message && (
        <div className="absolute bottom-4 left-10 right-10 text-center">
          <p className="text-xs opacity-50 italic">{data.message}</p>
        </div>
      )}
    </div>
  );
}

function StatModule({ label, value, unit, subText }: { label: string, value: any, unit?: string, subText: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
      <p className="text-[10px] font-bold opacity-60 tracking-wider mb-2 uppercase">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {unit && <span className="text-sm font-medium opacity-80">{unit}</span>}
      </div>
      <p className="text-[11px] mt-4 opacity-80 leading-tight line-clamp-2">{subText}</p>
    </div>
  );
}
