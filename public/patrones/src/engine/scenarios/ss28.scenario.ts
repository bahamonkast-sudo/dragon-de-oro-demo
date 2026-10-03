import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS28Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE COMPRA - CALL): 1R -> 1V -> 2R -> CALL
    // 0: 1 Rojo (cuerpo medio inicial)
    { o: 99.2, h: 99.4, l: 96.6, c: 97.0 },
    // 1: 1 Verde (impulso alcista hacia el techo)
    { o: 97.0, h: 103.2, l: 96.8, c: 102.6 },
    // 2: 1ª Roja (cuerpo corto superior de retroceso)
    { o: 102.6, h: 102.8, l: 99.8, c: 100.2 },
    // 3: 2ª Roja (TRIGGER: caída profunda que agota el ciclo 1R-1V-2R)
    { o: 100.2, h: 101.0, l: 94.8, c: 95.2 },
    // 4: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 95.2, h: 101.6, l: 94.6, c: 101.2 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA DE VENTA (PUT): 1V -> 1R -> 2V -> PUT
    // 0: 1 Verde (cuerpo medio inicial)
    { o: 98.0, h: 100.4, l: 97.8, c: 100.2 },
    // 1: 1 Rojo (impulso bajista que marca el suelo)
    { o: 100.2, h: 100.4, l: 94.6, c: 95.0 },
    // 2: 1ª Verde (cuerpo corto inferior de rebote)
    { o: 95.0, h: 97.6, l: 94.8, c: 97.2 },
    // 3: 2ª Verde (TRIGGER: subida que agota el ciclo 1V-1R-2V)
    { o: 97.2, h: 102.2, l: 96.8, c: 101.8 },
    // 4: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 101.8, h: 102.2, l: 96.0, c: 96.5 }
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
    triggerIndex: 3, // Cierre de la 4ª vela (2ª roja)
    resolutionIndex: 4, // Vela de operación
    snrLevel: isCallSetup ? 95.2 : 101.8,
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
