import React, { useState } from 'react';
import { getExplanation, DIDACTIC_PATTERNS } from '../services/tradingAssistant';

export const TradingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePatternKey, setActivePatternKey] = useState('ss03');
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu asistente de trading. Pregúntame por qué ocurre cualquier patrón, quién cae en la trampa o la razón exacta del gatillo según el libro.'
    }
  ]);

  const handleAsk = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;

    const query = inputQuery;
    setInputQuery('');

    let detectedKey = activePatternKey;
    Object.keys(DIDACTIC_PATTERNS).forEach(k => {
      if (query.toLowerCase().includes(k)) detectedKey = k;
    });

    const responseText = getExplanation(detectedKey, query);

    setMessages(prev => [
      ...prev,
      { sender: 'user', text: query },
      { sender: 'ai', text: responseText }
    ]);
  };

  const handleQuickExplain = (key: string) => {
    setActivePatternKey(key);
    const text = getExplanation(key);
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: `Explícame el porqué del patrón ${key.toUpperCase()}` },
      { sender: 'ai', text }
    ]);
  };

  return (
    <aside aria-label="Asistente de Trading" className="fixed bottom-14 right-6 z-50 select-none">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-wide">Preguntar a la IA</span>
        </button>
      )}

      {isOpen && (
        <div className="w-96 h-[480px] bg-[#0c121e] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">
          <div className="px-4 py-3 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Copiloto de Patrones
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-base leading-none px-1"
            >
              ✕
            </button>
          </div>

          <div className="px-3 py-2 bg-[#090e18] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-slate-500 font-mono shrink-0">Ver por qué:</span>
            {['ss01', 'ss03', 'ss08', 'ss14', 'ss24', 'ss25'].map(k => (
              <button
                key={k}
                onClick={() => handleQuickExplain(k)}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-300 border border-slate-700/50 transition-colors"
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-[#141d2f] text-slate-200 border border-slate-800/80 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                  {m.sender === 'user' ? 'Tú' : 'IA Granjita'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAsk} className="p-2.5 bg-[#0a101c] border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="¿Por qué la mecha rompe el mínimo?..."
              className="flex-1 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
