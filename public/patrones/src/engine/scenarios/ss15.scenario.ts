import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS15Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isPutSetup = direction === 'PUT';

  const raw = isPutSetup ? [
    // CONFIGURACIÓN BAJISTA (Lámina exacta del libro):
    // 0: Martillo (cuerpo verde arriba, mecha inferior larga)
    { o: 99.2, h: 101.0, l: 96.0, c: 100.8 },
    // 1: Martillo Invertido (TRIGGER: cuerpo rojo abajo, mecha superior muy larga)
    { o: 100.5, h: 104.5, l: 98.8, c: 99.0 },
    // 2: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 99.0, h: 99.2, l: 96.5, c: 96.8 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA ALCISTA:
    // 0: Martillo Invertido previo
    { o: 100.8, h: 104.0, l: 99.0, c: 99.2 },
    // 1: Martillo clásico (TRIGGER: mecha inferior de rechazo al alza)
    { o: 99.5, h: 101.2, l: 95.5, c: 101.0 },
    // 2: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 101.0, h: 103.5, l: 100.8, c: 103.2 }
  ];

  raw.forEach((item, idx) => {
    candles.push({
      time: baseTimestamp + (idx * step),
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
    });
  });

  return {
    candles,
    triggerIndex: 1, // Se decide al cierre del Martillo Invertido
    resolutionIndex: 2, // Vela de operación
    snrLevel: isPutSetup ? 100.5 : 99.5,
    expectedAction: isPutSetup ? 'PUT' : 'CALL',
  };
}
