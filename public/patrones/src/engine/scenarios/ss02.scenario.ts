import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS02Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = [
    { o: 97.0, h: 100.5, l: 96.5, c: 100.0 },   // 0: Verde techo (SNR en 100.00)
    { o: 100.0, h: 100.8, l: 98.2, c: 98.5 },  // 1: Roja 1
    { o: 98.5, h: 99.0, l: 95.8, c: 96.2 },    // 2: Roja 2
    { o: 96.2, h: 96.5, l: 93.0, c: 93.5 },    // 3: Roja fondo valle
    { o: 93.5, h: 96.8, l: 93.2, c: 96.5 },    // 4: Verde recuperación
    { o: 96.5, h: 98.5, l: 96.2, c: 98.0 },    // 5: Verde subida
    { o: 98.0, h: 101.2, l: 97.8, c: 100.8 },  // 6: Ruptura de nivel
    // 7: Vela de Espera (la vela negra de Anita)
    isCall
      ? { o: 100.8, h: 102.8, l: 100.6, c: 102.4 }
      : { o: 100.8, h: 101.0, l: 99.0, c: 99.4 },
    // 8: Vela de Operación final
    isCall
      ? { o: 102.4, h: 104.2, l: 102.0, c: 103.8 }
      : { o: 99.4, h: 99.8, l: 97.5, c: 97.8 }
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
    triggerIndex: 7, // Decisión tras cerrar la vela de espera
    resolutionIndex: 8,
    snrLevel: 100.0,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
