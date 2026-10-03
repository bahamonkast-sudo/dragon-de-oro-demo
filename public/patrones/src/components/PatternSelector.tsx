import React from 'react';
import { usePatterns } from '../data/patterns';
import type { STPattern } from '../types';

export const PatternSelector: React.FC = () => {
  const { patterns, selectedPattern, selectPattern, searchQuery, setSearchQuery } = usePatterns();

  return (
    <aside className="w-80 h-full flex flex-col bg-[#0b111c] border-r border-slate-800/80 select-none">
      {/* Cabecera del panel */}
      <div className="p-4 border-b border-slate-800/70">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-bold tracking-wider text-slate-200 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            Biblioteca de Velas
          </h1>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
            {patterns.length} patrones
          </span>
        </div>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar patrón o código..."
            className="w-full bg-[#080d16] text-xs text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* SEPARADOR SUTIL DE CABECERA */}
      <div className="relative px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500/70">
            Patrones Seguros
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
        </div>
      </div>

      {/* Lista de selección de velas */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {patterns.map((item: STPattern, index: number) => {
          const isSelected = (selectedPattern?.id || '').toLowerCase() === item.id.toLowerCase();

          return (
            <React.Fragment key={item.id}>
              <button
                onClick={() => selectPattern(item)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all duration-150 relative group ${
                  isSelected
                    ? 'bg-slate-800/60 border-emerald-500/40 shadow-sm shadow-emerald-950/30'
                    : 'bg-[#080d16]/50 border-slate-800/50 hover:bg-slate-800/30 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50 group-hover:text-slate-300'
                    }`}
                  >
                    {item.code}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    MTG: {item.mtgPolicy || '1_STEP'}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-300 truncate group-hover:text-white">
                  {item.name}
                </div>
              </button>

              {/* SEPARADOR SUTIL ENTRE ÍTEMS (CADA 5 ELEMENTOS) */}
              {(index + 1) % 5 === 0 && index !== patterns.length - 1 && (
                <div className="py-1 px-4">
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-800/60 to-transparent" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
};
