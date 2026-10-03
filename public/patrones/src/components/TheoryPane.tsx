import React from 'react';
import { usePatterns } from '../data/patterns';

export const TheoryPane: React.FC = () => {
  const { selectedPattern } = usePatterns();

  if (!selectedPattern) {
    return (
      <div className="p-4 text-xs text-gray-500">
        Sin patrón seleccionado.
      </div>
    );
  }

  const p: any = selectedPattern;
  const requirements: string[] = p.requirements || p.bookRules?.requirements || [];
  const precautions: string[] = p.precautions || p.bookRules?.precautions || [];

  return (
    <div className="flex flex-col h-full w-full p-5 space-y-5 text-sm text-gray-200 overflow-y-auto font-sans">
      
      {/* Encabezado */}
      <div className="border-b border-gray-800 pb-3">
        <h2 className="text-base font-bold text-white tracking-wide">
          Lectura Estricta del Libro
        </h2>
        <p className="text-xs text-emerald-400 mt-1 font-mono">
          {p.code || p.id} • {p.classification?.tradeType || 'OPERACIÓN'}
        </p>
      </div>

      {/* Requisitos de Entrada */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Requisitos Obligatorios
        </h3>
        {requirements.length > 0 ? (
          <ul className="space-y-2">
            {requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-gray-300">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">Sin requisitos listados.</p>
        )}
      </div>

      {/* Regla SNR */}
      {p.snrRule && (
        <div className="bg-gray-900/60 p-3 rounded border border-gray-800 space-y-1 text-xs">
          <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] block">
            Regla de Nivel SNR
          </span>
          <p className="text-gray-300">
            <strong>Nivel:</strong> {p.snrRule.nivel || 'Horizontal'}
          </p>
          {p.snrRule.tipoRuptura && (
            <p className="text-gray-300">
              <strong>Tipo de Ruptura:</strong> {p.snrRule.tipoRuptura}
            </p>
          )}
        </div>
      )}

      {/* Regla Estocástica */}
      {p.stochRule && (
        <div className="bg-gray-900/60 p-3 rounded border border-gray-800 space-y-1 text-xs">
          <span className="font-semibold text-blue-400 uppercase tracking-wider text-[10px] block">
            Filtro Estocástico
          </span>
          <p className="text-gray-300">{p.stochRule}</p>
        </div>
      )}

      {/* Precauciones */}
      {precautions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
            Precauciones
          </h3>
          <ul className="space-y-1.5">
            {precautions.map((prec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-gray-400">
                <span className="text-red-400 shrink-0">•</span>
                <span>{prec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Política Martingala (MTG) */}
      <div className="pt-2">
        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
          Badge MTG Destacado
        </span>
        <span className="inline-block px-2.5 py-1 text-xs font-bold font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          {p.mtgPolicy || '1_STEP'}
        </span>
      </div>

    </div>
  );
};
