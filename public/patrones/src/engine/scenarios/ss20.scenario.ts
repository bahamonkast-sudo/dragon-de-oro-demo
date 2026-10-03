import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS20Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE COMPRA - CALL):
    // 0 y 1: Velas verdes de impulso previo
    { o: 95.0, h: 97.4, l: 94.8, c: 97.2 },   // 0: Verde 1
    { o: 97.2, h: 99.5, l: 97.0, c: 99.2 },   // 1: Verde 2
    // 2: VELA DOJI (Pausa en tendencia, línea en 99.80)
    { o: 99.6, h: 100.8, l: 98.6, c: 99.65 },
    // 3: VELA DEL MISMO COLOR (TRIGGER: vela verde estándar, no martillo ni gigante, cierra en 102.40 superando el Doji)
    { o: 99.65, h: 102.6, l: 99.5, c: 102.4 },
    // 4: VELA DE OPERACIÓN (CALL ITM)
    { o: 102.4, h: 105.6, l: 102.2, c: 105.2 }
  ] : [
    // LÁMINA 3 (CONFIGURACIÓN DE VENTA - PUT):
    // 0 y 1: Velas rojas de impulso previo
    { o: 105.0, h: 105.2, l: 102.8, c: 103.0 }, // 0: Roja 1
    { o: 103.0, h: 103.2, l: 100.8, c: 101.0 }, // 1: Roja 2
    // 2: VELA DOJI (Pausa en tendencia, línea en 100.40)
    { o: 100.4, h: 101.5, l: 99.2, c: 100.35 },
    // 3: VELA DEL MISMO COLOR (TRIGGER: vela roja estándar, no martillo ni gigante, cierra en 97.80 perforando el Doji)
    { o: 100.35, h: 100.5, l: 97.6, c: 97.8 },
    // 4: VELA DE TRADING / OPERACIÓN (PUT ITM)
    { o: 97.8, h: 98.0, l: 94.8, c: 95.2 }
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
    triggerIndex: 3, // Al cierre de la vela del mismo color post-Doji
    resolutionIndex: 4, // Vela de operación
    snrLevel: isCallSetup ? 99.65 : 100.35, // Nivel del Doji
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
