import React, { useState, useEffect } from 'react';
import { usePatterns } from '../data/patterns';
import { buildScenarioForPattern } from '../engine/candlestickBuilder';

export const ActionBar: React.FC = () => {
  const { patterns, selectedPattern, selectPattern } = usePatterns();
  const [currentDirection, setCurrentDirection] = useState<'CALL' | 'PUT'>('CALL');
  const [userChoice, setUserChoice] = useState<'CALL' | 'PUT' | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Reiniciar cuando cambia de patrón
  useEffect(() => {
    setUserChoice(null);
    setResult(null);
  }, [selectedPattern?.id]);

  // Escuchar cuando el usuario cambia entre Alcista y Bajista en el Chart
  useEffect(() => {
    const handleDirectionChange = (e: any) => {
      setCurrentDirection(e.detail.direction);
      setUserChoice(null);
      setResult(null);
    };

    window.addEventListener('direction-changed', handleDirectionChange);
    return () => window.removeEventListener('direction-changed', handleDirectionChange);
  }, []);

  const handleTrade = (choice: 'CALL' | 'PUT') => {
    if (userChoice !== null || !selectedPattern) return;

    setUserChoice(choice);
    // Evaluamos contra la dirección seleccionada (CALL o PUT)
    const scenario = buildScenarioForPattern(selectedPattern, currentDirection);
    const isCorrect = choice === scenario.expectedAction;

    setResult({
      isCorrect,
      message: isCorrect 
        ? `¡ACIERTO! La lectura técnica indicaba ${scenario.expectedAction}` 
        : `FALLO. La dirección técnica del libro era ${scenario.expectedAction}`,
    });

    // Despachar a ChartEngine para animar la vela de resolución
    window.dispatchEvent(new CustomEvent('trade-executed', {
      detail: { choice, scenario }
    }));
  };

  const handleNext = () => {
    if (!selectedPattern || patterns.length === 0) return;
    const currentIndex = patterns.findIndex((p) => p.id === selectedPattern.id);
    const nextIndex = (currentIndex + 1) % patterns.length;
    selectPattern(patterns[nextIndex]);
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 w-full bg-[#0a0f1d] border-t border-gray-800 shrink-0">
      
      {/* Botones de Entrada */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleTrade('CALL')}
          disabled={userChoice !== null}
          className={`px-6 py-2 rounded font-bold text-xs tracking-wider transition-all ${
            userChoice === null
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer active:scale-95'
              : userChoice === 'CALL'
              ? 'bg-emerald-600 text-white opacity-100 ring-2 ring-emerald-400'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-40'
          }`}
        >
          ▲ CALL (COMPRA)
        </button>

        <button
          onClick={() => handleTrade('PUT')}
          disabled={userChoice !== null}
          className={`px-6 py-2 rounded font-bold text-xs tracking-wider transition-all ${
            userChoice === null
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer active:scale-95'
              : userChoice === 'PUT'
              ? 'bg-rose-600 text-white opacity-100 ring-2 ring-rose-400'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-40'
          }`}
        >
          ▼ PUT (VENTA)
        </button>
      </div>

      {/* Retroalimentación en tiempo real */}
      <div className="flex-1 text-center px-4">
        {result ? (
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded border ${
                result.isCorrect
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}
            >
              {result.isCorrect ? '✔ ITM (GANADA)' : '✖ OTM (PERDIDA)'}
            </span>
            <span className="text-xs text-gray-300 font-medium">
              {result.message}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">
            Modo Práctica ({currentDirection === 'CALL' ? 'Alcista' : 'Bajista'}): Observa el nivel SNR y decide <strong className="text-emerald-400">CALL</strong> o <strong className="text-rose-400">PUT</strong>.
          </span>
        )}
      </div>

      {/* Botón Siguiente Patrón */}
      <button
        onClick={handleNext}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded text-xs font-semibold tracking-wide border border-gray-700 transition-colors"
      >
        Siguiente Patrón →
      </button>

    </div>
  );
};
