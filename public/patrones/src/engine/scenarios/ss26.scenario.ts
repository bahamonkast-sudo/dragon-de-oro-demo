import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS26Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isPutSetup = direction === 'PUT';

  const raw = isPutSetup ? [
    // LÁMINA 2 (PATRÓN BRASILEÑO - CONFIGURACIÓN DE VENTA - PUT):
    // 0: 1 Rojo (cuerpo corto abajo)
    { o: 98.4, h: 99.2, l: 96.8, c: 97.2 },
    // 1: 1ª Verde (cuerpo verde largo de subida)
    { o: 97.2, h: 103.0, l: 96.6, c: 102.5 },
    // 2: 2ª Verde (cuerpo verde superior de techo)
    { o: 102.5, h: 104.8, l: 102.2, c: 104.5 },
    // 3: 1 Rojo (rechazo con cuerpo rojo dominante)
    { o: 104.5, h: 105.2, l: 99.8, c: 100.4 },
    // 4: 1 Verde (TRIGGER: cierre de la secuencia 1R - 2V - 1R - 1V)
    { o: 100.4, h: 102.2, l: 98.6, c: 101.4 },
    // 5: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 101.4, h: 101.8, l: 96.5, c: 97.0 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA DE COMPRA (1V - 2R - 1V - 1R -> CALL):
    // 0: 1 Verde
    { o: 101.4, h: 101.8, l: 97.5, c: 101.8 },
    // 1: 1ª Roja
    { o: 101.8, h: 102.5, l: 96.8, c: 97.4 },
    // 2: 2ª Roja
    { o: 97.4, h: 97.6, l: 95.0, c: 95.5 },
    // 3: 1 Verde
    { o: 95.5, h: 99.2, l: 95.2, c: 98.8 },
    // 4: 1 Roja (TRIGGER)
    { o: 98.8, h: 99.0, l: 97.2, c: 97.6 },
    // 5: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 97.6, h: 102.0, l: 96.8, c: 101.6 }
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
    triggerIndex: 4, // Cierre de la 5ª vela del ciclo
    resolutionIndex: 5, // Vela de operación
    snrLevel: isPutSetup ? 101.4 : 97.6,
    expectedAction: isPutSetup ? 'PUT' : 'CALL',
  };
}
