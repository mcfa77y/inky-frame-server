import React, { useState } from 'react';

interface ZipInputProps {
  onSearch: (zip: string) => void;
  loading: boolean;
}

export function ZipInput({ onSearch, loading }: ZipInputProps) {
  const [zip, setZip] = useState('94110');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(zip);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-8 items-center">
      <div className="relative group">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter Zip Code"
          className="bg-white/10 border border-white/20 rounded-full px-6 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-white placeholder-white/40"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-white/20 hover:bg-white/30 text-white rounded-full px-6 py-2 font-medium transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
