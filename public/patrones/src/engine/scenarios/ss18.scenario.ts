import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS18Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isPutSetup = direction === 'PUT';

  const raw = isPutSetup ? [
    // LÁMINA DEL LIBRO (CONFIGURACIÓN BAJISTA - PUT):
    // 0: Vela Verde Sin Cola (low === open === 98.00, mecha superior alta hasta 102.20, c: 100.80)
    { o: 98.0, h: 102.2, l: 98.0, c: 100.8 },
    // 1: Vela Roja Sin Cola (TRIGGER: high === open === 100.80, mecha inferior hasta 99.00, c: 99.60)
    { o: 100.8, h: 100.8, l: 99.0, c: 99.6 },
    // 2: VELA DE COMERCIO BAJISTA (PUT ITM)
    { o: 99.6, h: 99.8, l: 96.5, c: 96.8 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA ALCISTA (CALL):
    // 0: Vela Roja Sin Cola inferior
    { o: 101.8, h: 102.0, l: 99.2, c: 99.2 },
    // 1: Vela Verde Sin Cola inferior (TRIGGER)
    { o: 99.2, h: 101.0, l: 99.2, c: 100.4 },
    // 2: VELA DE COMERCIO ALCISTA (CALL ITM)
    { o: 100.4, h: 103.5, l: 100.2, c: 103.0 }
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
    triggerIndex: 1, // Tras cerrar la vela roja sin cola
    resolutionIndex: 2, // Vela de comercio
    snrLevel: isPutSetup ? 100.8 : 99.2,
    expectedAction: isPutSetup ? 'PUT' : 'CALL',
  };
}
