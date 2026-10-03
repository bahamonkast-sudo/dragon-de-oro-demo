import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS12Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // LÁMINA 2: Verde (0) -> Roja (1) -> Doji Verde (2) -> Operación CALL (3)
    { o: 98.0, h: 101.5, l: 97.6, c: 101.2 }, // 0: Vela Verde inicial
    { o: 101.2, h: 101.4, l: 98.8, c: 99.2 }, // 1: Vela Roja consecutiva
    // 2: DOJI VERDE (Trigger: apertura y cierre casi idénticos con sesgo comprador)
    { o: 99.6, h: 101.4, l: 98.0, c: 99.65 },
    // 3: Vela comercial en dirección alcista (CALL ITM)
    { o: 99.65, h: 102.5, l: 99.4, c: 102.2 }
  ] : [
    // LÁMINA 3: Verde (0) -> Roja (1) -> Doji Rojo (2) -> Operación PUT (3)
    { o: 98.5, h: 101.8, l: 98.2, c: 101.5 }, // 0: Vela Verde inicial
    { o: 101.5, h: 101.7, l: 99.2, c: 99.5 }, // 1: Vela Roja consecutiva
    // 2: DOJI ROJO (Trigger: apertura y cierre casi idénticos con sesgo vendedor)
    { o: 99.6, h: 101.2, l: 97.8, c: 99.55 },
    // 3: Vela comercial en dirección bajista (PUT ITM)
    { o: 99.55, h: 99.8, l: 96.8, c: 97.2 }
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
    triggerIndex: 2, // Se decide al cierre del Doji
    resolutionIndex: 3, // Vela de operación
    snrLevel: 99.6,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
