import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS22Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE COMPRA - CALL):
    // 0, 1, 2: Tres velas verdes consecutivas de impulso
    { o: 95.0, h: 97.2, l: 94.8, c: 97.0 },   // 0: Verde 1
    { o: 97.0, h: 99.4, l: 96.8, c: 99.0 },   // 1: Verde 2
    { o: 99.0, h: 102.5, l: 98.8, c: 102.2 }, // 2: Verde 3
    // 3, 4, 5: Tres velas rojas consecutivas de retroceso
    { o: 102.0, h: 102.3, l: 100.8, c: 101.2 },// 3: Roja 1 (corta)
    { o: 101.2, h: 101.4, l: 99.5, c: 99.8 },  // 4: Roja 2
    { o: 99.8, h: 100.0, l: 98.2, c: 98.5 },   // 5: Roja 3 (fondo del retroceso)
    // 6: VELA VERDE ENVOLVENTE (TRIGGER: engulla las 3 rojas, cubre de 98.30 a 103.00)
    { o: 98.3, h: 103.5, l: 98.0, c: 103.0 },
    // 7: VELA DE OPERACIÓN (CALL ITM)
    { o: 103.0, h: 105.8, l: 102.8, c: 105.5 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA BAJISTA (PUT):
    // 0, 1, 2: Tres velas rojas consecutivas de impulso
    { o: 105.0, h: 105.2, l: 102.8, c: 103.0 }, // 0: Roja 1
    { o: 103.0, h: 103.2, l: 100.6, c: 101.0 }, // 1: Roja 2
    { o: 101.0, h: 101.2, l: 97.5, c: 97.8 },   // 2: Roja 3
    // 3, 4, 5: Tres velas verdes consecutivas de retroceso
    { o: 98.0, h: 99.2, l: 97.8, c: 98.8 },    // 3: Verde 1
    { o: 98.8, h: 100.5, l: 98.6, c: 100.2 },  // 4: Verde 2
    { o: 100.2, h: 101.8, l: 100.0, c: 101.5 },// 5: Verde 3 (techo del retroceso)
    // 6: VELA ROJA ENVOLVENTE (TRIGGER: engulla las 3 verdes, cubre de 101.70 a 97.00)
    { o: 101.7, h: 102.0, l: 96.5, c: 97.0 },
    // 7: VELA DE OPERACIÓN (PUT ITM)
    { o: 97.0, h: 97.2, l: 94.2, c: 94.5 }
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
    triggerIndex: 6, // Al cierre de la vela envolvente
    resolutionIndex: 7, // Vela de operación
    snrLevel: isCallSetup ? 102.2 : 97.8, // Nivel del techo/suelo antes del retroceso
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
