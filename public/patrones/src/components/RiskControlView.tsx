import React, { useState } from 'react';

export const RiskControlView: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full h-full bg-[#080c14] overflow-hidden flex flex-col">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080c14] text-slate-400 font-mono text-xs gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando Consola de Control de Riesgo...</span>
        </div>
      )}
      <iframe
        src="http://localhost:8088"
        title="La Granjita - Control de Riesgo"
        className="w-full h-full border-none flex-1"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};
