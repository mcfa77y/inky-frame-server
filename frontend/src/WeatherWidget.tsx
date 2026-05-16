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

  if (view === 'today') return <TodayView data={data} />;
  if (view === 'forecast') return <ForecastView data={data} />;
  return <CurrentView data={data} />;
}

function CurrentView({ data }: { data: any }) {
  const condition = data.weather?.[0]?.main?.toLowerCase() || 'clear';
  const gradient = getGradient(condition);

  return (
    <div className={`w-[800px] h-[480px] bg-gradient-to-br ${gradient} rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden border border-white/20 font-sans`}>
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

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

      <div className="grid grid-cols-4 gap-4 mt-12 relative z-10">
        <StatModule label="FEELS LIKE" value={`${Math.round(data.main?.feels_like)}°`} subText="Similar to the actual temperature." />
        <StatModule label="HUMIDITY" value={`${data.main?.humidity}%`} subText={`The dew point is ${Math.round(data.main?.temp - 5)}° right now.`} />
        <StatModule label="WIND" value={`${Math.round(data.wind?.speed)}`} unit="MPH" subText="Gusts up to 15 mph." />
        <StatModule label="PRESSURE" value={data.main?.pressure} unit="hPa" subText="Steady in the last hour." />
      </div>

      {data.message && <MockWarning message={data.message} />}
    </div>
  );
}

function TodayView({ data }: { data: any }) {
  // OWM forecast returns 3-hour steps. Let's take the first 8 (24 hours)
  const hourly = data.list?.slice(0, 8) || [];
  const current = hourly[0];
  const condition = current?.weather?.[0]?.main?.toLowerCase() || 'clear';
  const gradient = getGradient(condition);

  return (
    <div className={`w-[800px] h-[480px] bg-gradient-to-br ${gradient} rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden border border-white/20 font-sans`}>
      <h1 className="text-3xl font-semibold mb-6">{data.city?.name || 'Today'}'s Forecast</h1>

      <div className="grid grid-cols-8 gap-2 h-64 mb-6">
        {hourly.map((item: any, i: number) => (
          <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col items-center justify-between border border-white/10">
            <p className="text-[10px] font-bold opacity-60">
              {new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric' })}
            </p>
            <img 
              src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
              alt="icon"
              className="w-10 h-10"
            />
            <p className="text-lg font-semibold">{Math.round(item.main.temp)}°</p>
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mt-1">
              <div className="bg-white h-full" style={{ width: `${item.pop * 100}%` }}></div>
            </div>
            <p className="text-[8px] opacity-60">{Math.round(item.pop * 100)}%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatModule label="FEELS LIKE" value={`${Math.round(current?.main?.feels_like)}°`} subText="Morning average." />
        <StatModule label="HUMIDITY" value={`${current?.main?.humidity}%`} subText="Next 24 hours." />
        <StatModule label="WIND" value={`${Math.round(current?.wind?.speed)}`} unit="MPH" subText="Max expected." />
        <StatModule label="PRECIP" value={`${Math.round(current?.pop * 100)}%`} subText="Peak chance." />
      </div>

      {data.message && <MockWarning message={data.message} />}
    </div>
  );
}

function ForecastView({ data }: { data: any }) {
  // Group forecast by day. OWM returns 40 items (5 days, every 3 hours)
  const daily = data.list ? data.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5) : [];
  const current = daily[0];
  const condition = current?.weather?.[0]?.main?.toLowerCase() || 'clear';
  const gradient = getGradient(condition);

  return (
    <div className={`w-[800px] h-[480px] bg-gradient-to-br ${gradient} rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden border border-white/20 font-sans`}>
      <h1 className="text-3xl font-semibold mb-8">{data.city?.name || '5-Day'} Forecast</h1>
      
      <div className="space-y-3">
        {daily.map((day: any, i: number) => (
          <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10">
            <div className="w-24">
              <p className="font-bold">
                {i === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-1 justify-center">
              <img 
                src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                alt="icon"
                className="w-10 h-10"
              />
              <p className="text-sm opacity-80 w-32 capitalize">{day.weather[0].description}</p>
            </div>
            <div className="flex items-center gap-8 w-48 justify-end font-medium">
              <div className="flex items-center gap-2">
                <span className="opacity-60 text-xs">LOW</span>
                <span>{Math.round(day.main.temp_min)}°</span>
              </div>
              <div className="w-16 h-1.5 bg-white/20 rounded-full relative">
                <div className="absolute inset-y-0 left-1/4 right-1/4 bg-white rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <span>{Math.round(day.main.temp_max)}°</span>
                <span className="opacity-60 text-xs">HIGH</span>
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

function StatModule({ label, value, unit, subText }: { label: string, value: any, unit?: string, subText: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
      <p className="text-[10px] font-bold opacity-60 tracking-wider mb-2 uppercase">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {unit && <span className="text-sm font-medium opacity-80">{unit}</span>}
      </div>
      <p className="text-[11px] mt-2 opacity-80 leading-tight line-clamp-2">{subText}</p>
    </div>
  );
}
