import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS07Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // ALCISTA: Verde -> Rojo -> Verde (0, 1, 2) -> Impulso de Verdes (3, 4, 5) -> 1 Roja Opuesta (6) -> Operación CALL (7)
    { o: 95.0, h: 96.6, l: 94.8, c: 96.4 },   // 0: Verde
    { o: 96.4, h: 96.8, l: 94.6, c: 95.0 },   // 1: Rojo
    { o: 95.0, h: 97.4, l: 94.8, c: 97.0 },   // 2: Verde
    { o: 97.0, h: 98.8, l: 96.8, c: 98.6 },   // 3: Verde impulso 1
    { o: 98.6, h: 101.4, l: 98.4, c: 101.0 }, // 4: Verde impulso 2
    { o: 101.0, h: 103.2, l: 100.8, c: 103.0 },// 5: Verde impulso 3
    // 6: 1 VELA ROJA OPUESTA (TRIGGER)
    { o: 103.0, h: 103.2, l: 100.6, c: 101.0 },
    // 7: VELA COMERCIAL DE OPERACIÓN (CALL ITM)
    { o: 101.0, h: 103.6, l: 100.8, c: 103.2 }
  ] : [
    // BAJISTA: Rojo -> Verde -> Rojo (0, 1, 2) -> Impulso de Rojas (3, 4, 5) -> 1 Verde Opuesta (6) -> Operación PUT (7)
    { o: 105.0, h: 105.4, l: 103.4, c: 103.6 }, // 0: Rojo
    { o: 103.6, h: 105.2, l: 103.4, c: 105.0 }, // 1: Verde
    { o: 105.0, h: 105.2, l: 102.8, c: 103.2 }, // 2: Rojo
    { o: 103.2, h: 103.4, l: 100.8, c: 101.0 }, // 3: Rojo impulso 1
    { o: 101.0, h: 101.2, l: 99.2, c: 99.4 },   // 4: Rojo impulso 2
    { o: 99.4, h: 99.6, l: 97.0, c: 97.2 },     // 5: Rojo impulso 3
    // 6: 1 VELA VERDE OPUESTA (TRIGGER)
    { o: 97.2, h: 99.2, l: 97.0, c: 99.0 },
    // 7: VELA COMERCIAL DE OPERACIÓN (PUT ITM)
    { o: 99.0, h: 99.2, l: 96.6, c: 96.8 }
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
    triggerIndex: 6, // Se decide tras el cierre de la vela opuesta
    resolutionIndex: 7, // Vela comercial de operación
    snrLevel: isCall ? 103.0 : 97.2,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
