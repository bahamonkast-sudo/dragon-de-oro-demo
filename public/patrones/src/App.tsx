import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChartEngine } from './components/ChartEngine';
import { ActionBar } from './components/ActionBar';
import { TheoryPane } from './components/TheoryPane';
import { TradingAIAssistant } from './components/TradingAIAssistant';
import { RiskControlView } from './components/RiskControlView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'risk'>('simulator');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* Barra de Navegacion Superior Maestra */}
      <header className="h-11 shrink-0 bg-[#090d16] border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-xs font-bold tracking-widest uppercase font-mono text-emerald-400">
              La Granjita
            </span>
          </div>
          <span className="text-slate-600 text-xs">|</span>
          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Simulador de Velas
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'risk'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Control de Riesgo
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
          <span>Sistema Operativo</span>
        </div>
      </header>

      {/* Cuerpo Principal: Las dos vistas preservan su estado en memoria */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* VISTA 1: Simulador de Velas (3 columnas intactas) */}
        <div className={`w-full h-full flex ${activeTab === 'simulator' ? '' : 'hidden'}`}>
          <div className="w-80 h-full shrink-0 border-r border-slate-800">
            <Sidebar />
          </div>

          <main className="flex-1 flex flex-col h-full min-w-0 bg-[#080c14] overflow-hidden">
            <div className="flex-1 w-full h-full relative overflow-hidden">
              <ChartEngine />
            </div>
            <div className="shrink-0 border-t border-slate-800">
              <ActionBar />
            </div>
          </main>

          <div className="w-96 h-full shrink-0 border-l border-slate-800 overflow-hidden">
            <TheoryPane />
          </div>

          <TradingAIAssistant />
        </div>

        {/* VISTA 2: Control de Riesgo Aislado */}
        <div className={`w-full h-full ${activeTab === 'risk' ? '' : 'hidden'}`}>
          <RiskControlView />
        </div>
      </div>
    </div>
  );
};

export default App;
