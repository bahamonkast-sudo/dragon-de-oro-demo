import React from 'react';
import { usePatterns } from '../data/patterns';
import type { STPattern } from '../types';

export const Sidebar: React.FC = () => {
  const { patterns, selectedPattern, searchQuery, setSearchQuery, selectPattern } = usePatterns();

  return (
    <div className="flex flex-col h-full w-full bg-[#0d131f] text-gray-300">
      <div className="p-3 border-b border-gray-800">
        <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2">
          Patrones Cargados ({patterns.length})
        </h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar patrón..."
          className="w-full px-2.5 py-1.5 text-xs bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40">
        {patterns.map((p) => {
          const isSelected = selectedPattern?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => selectPattern(p)}
              className={`w-full text-left px-3.5 py-2.5 flex flex-col gap-0.5 transition-colors ${
                isSelected
                  ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-white'
                  : 'hover:bg-gray-800/50 text-gray-300'
              }`}
            >
              <span className="text-xs font-semibold leading-tight line-clamp-1">
                {p.name}
              </span>
              <span className="text-[10px] font-mono text-gray-500 uppercase">
                {p.code || p.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
