import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS27Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isPutSetup = direction === 'PUT';

  const raw = isPutSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE VENTA - PUT): 1V -> 1R -> 2V -> PUT
    // 0: 1 Verde (cuerpo corto arriba, mecha inferior larga)
    { o: 101.4, h: 102.8, l: 97.4, c: 101.8 },
    // 1: 1 Rojo (vela roja dominante con caída limpia)
    { o: 101.8, h: 102.0, l: 95.8, c: 96.2 },
    // 2: 1ª Verde de recuperación
    { o: 96.2, h: 100.2, l: 95.8, c: 99.8 },
    // 3: 2ª Verde (TRIGGER: agota el rebote, cierra ciclo 1V-1R-2V)
    { o: 99.8, h: 102.0, l: 99.4, c: 101.6 },
    // 4: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 101.6, h: 102.2, l: 96.6, c: 97.2 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA DE COMPRA (CALL): 1R -> 1V -> 2R -> CALL
    // 0: 1 Rojo (cuerpo corto abajo, mecha superior larga)
    { o: 98.6, h: 102.6, l: 97.2, c: 98.2 },
    // 1: 1 Verde (vela verde dominante de subida)
    { o: 98.2, h: 104.2, l: 98.0, c: 103.8 },
    // 2: 1ª Roja de retroceso
    { o: 103.8, h: 104.2, l: 99.8, c: 100.2 },
    // 3: 2ª Roja (TRIGGER: agota la caída, cierra ciclo 1R-1V-2R)
    { o: 100.2, h: 100.6, l: 98.0, c: 98.4 },
    // 4: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 98.4, h: 103.4, l: 97.8, c: 102.8 }
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
    triggerIndex: 3, // Cierre de la 4ª vela del ciclo
    resolutionIndex: 4, // Vela de operación
    snrLevel: isPutSetup ? 101.6 : 98.4,
    expectedAction: isPutSetup ? 'PUT' : 'CALL',
  };
}
