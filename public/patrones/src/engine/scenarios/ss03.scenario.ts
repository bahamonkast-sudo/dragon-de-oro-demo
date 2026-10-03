import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS03Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // Alcista: V con ruptura directa y entrada CALL
    { o: 97.0, h: 100.5, l: 96.5, c: 100.0 },   // 0: Verde techo (SNR en 100.00)
    { o: 100.0, h: 100.9, l: 98.0, c: 98.5 },  // 1: Roja 1
    { o: 98.5, h: 99.2, l: 95.8, c: 96.2 },    // 2: Roja 2
    { o: 96.2, h: 96.6, l: 93.5, c: 94.0 },    // 3: Roja fondo
    { o: 94.0, h: 96.8, l: 93.8, c: 96.4 },    // 4: Verde base
    { o: 96.4, h: 98.2, l: 96.0, c: 97.8 },    // 5: Verde subida
    { o: 97.8, h: 101.2, l: 97.5, c: 100.8 },  // 6: Trigger Ruptura directa
    { o: 100.8, h: 103.8, l: 100.5, c: 103.4 } // 7: Operación CALL
  ] : [
    // Bajista: V invertida con ruptura directa y entrada PUT
    { o: 101.5, h: 102.0, l: 98.5, c: 98.8 },  // 0: Roja
    { o: 98.8, h: 100.2, l: 98.6, c: 99.8 },   // 1: Verde 1
    { o: 99.8, h: 102.4, l: 99.5, c: 102.0 },  // 2: Verde 2 (SNR en 99.80)
    { o: 102.0, h: 103.8, l: 101.8, c: 103.2 }, // 3: Cúspide
    { o: 103.2, h: 103.4, l: 101.2, c: 101.6 }, // 4: Roja caída
    { o: 101.6, h: 101.8, l: 98.8, c: 99.2 },   // 5: Trigger Ruptura directa
    { o: 99.2, h: 99.5, l: 96.2, c: 96.5 }     // 6: Operación PUT
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
    triggerIndex: isCall ? 6 : 5,
    resolutionIndex: isCall ? 7 : 6,
    snrLevel: isCall ? 100.0 : 99.8,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
