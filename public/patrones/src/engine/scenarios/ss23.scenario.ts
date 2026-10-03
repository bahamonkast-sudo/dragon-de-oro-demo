import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS23Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isPutSetup = direction === 'PUT';

  const raw = isPutSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE VENTA - PUT):
    // 0, 1, 2: Tres velas rojas consecutivas de impulso bajista
    { o: 105.0, h: 105.4, l: 101.8, c: 102.0 }, // 0: Roja 1
    { o: 102.0, h: 102.2, l: 99.4, c: 99.6 },   // 1: Roja 2
    { o: 99.6, h: 99.8, l: 96.8, c: 97.0 },     // 2: Roja 3
    // 3, 4, 5: Tres velas verdes consecutivas de retroceso
    { o: 97.0, h: 98.2, l: 96.8, c: 98.0 },     // 3: Verde 1
    { o: 98.0, h: 99.4, l: 97.8, c: 99.2 },     // 4: Verde 2
    { o: 99.2, h: 101.0, l: 99.0, c: 100.8 },   // 5: Verde 3 (techo retroceso)
    // 6: VELA ROJA ENVOLVENTE (TRIGGER: engulle las 3 verdes, cubre de 100.90 a 96.00)
    { o: 100.9, h: 101.2, l: 95.5, c: 96.0 },
    // 7: VELA COMERCIAL DE OPERACIÓN (PUT ITM)
    { o: 96.0, h: 96.2, l: 93.8, c: 94.0 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA ALCISTA (CALL):
    // 0, 1, 2: Tres velas verdes consecutivas de impulso
    { o: 95.0, h: 97.2, l: 94.8, c: 97.0 },   // 0: Verde 1
    { o: 97.0, h: 99.4, l: 96.8, c: 99.0 },   // 1: Verde 2
    { o: 99.0, h: 102.5, l: 98.8, c: 102.2 }, // 2: Verde 3
    // 3, 4, 5: Tres velas rojas consecutivas de retroceso
    { o: 102.0, h: 102.3, l: 100.8, c: 101.2 },// 3: Roja 1
    { o: 101.2, h: 101.4, l: 99.5, c: 99.8 },  // 4: Roja 2
    { o: 99.8, h: 100.0, l: 98.2, c: 98.5 },   // 5: Roja 3
    // 6: VELA VERDE ENVOLVENTE (TRIGGER)
    { o: 98.3, h: 103.5, l: 98.0, c: 103.0 },
    // 7: VELA COMERCIAL ALCISTA (CALL ITM)
    { o: 103.0, h: 105.8, l: 102.8, c: 105.5 }
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
    triggerIndex: 6, // Al cierre de la vela roja envolvente
    resolutionIndex: 7, // Vela comercial de operación
    snrLevel: isPutSetup ? 97.0 : 102.2, // Suelo/techo antes del retroceso
    expectedAction: isPutSetup ? 'PUT' : 'CALL',
  };
}
