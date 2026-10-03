import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS25Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (PATRÓN BRASILEÑO - CONFIGURACIÓN DE COMPRA - CALL):
    // 0: 1 Verde (cuerpo corto arriba, mecha inferior larga)
    { o: 101.4, h: 101.8, l: 97.5, c: 101.8 },
    // 1: 1ª Roja (cuerpo rojo largo envolvente)
    { o: 101.8, h: 102.5, l: 96.8, c: 97.4 },
    // 2: 2ª Roja (cuerpo rojo que marca el piso del rango)
    { o: 97.4, h: 97.6, l: 95.0, c: 95.5 },
    // 3: 1 Verde (recuperación alcista interna)
    { o: 95.5, h: 99.2, l: 95.2, c: 98.8 },
    // 4: 1 Roja (TRIGGER: cierre de la secuencia 1V-2R-1V-1R)
    { o: 98.8, h: 99.0, l: 97.2, c: 97.6 },
    // 5: VELA DE OPERACIÓN (CALL ITM)
    { o: 97.6, h: 102.0, l: 96.8, c: 101.6 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA DE VENTA (1R - 2V - 1R - 1V -> PUT):
    // 0: 1 Roja (cuerpo corto abajo, mecha superior larga)
    { o: 98.6, h: 102.5, l: 98.2, c: 98.2 },
    // 1: 1ª Verde (cuerpo verde largo envolvente)
    { o: 98.2, h: 103.2, l: 97.5, c: 102.6 },
    // 2: 2ª Verde (cuerpo verde que marca el techo del rango)
    { o: 102.6, h: 105.0, l: 102.4, c: 104.5 },
    // 3: 1 Roja (retroceso bajista interno)
    { o: 104.5, h: 104.8, l: 100.8, c: 101.2 },
    // 4: 1 Verde (TRIGGER: cierre de la secuencia 1R-2V-1R-1V)
    { o: 101.2, h: 102.8, l: 101.0, c: 102.4 },
    // 5: VELA DE OPERACIÓN (PUT ITM)
    { o: 102.4, h: 102.6, l: 98.0, c: 98.4 }
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
    triggerIndex: 4, // Al cierre de la 5ª vela del ciclo
    resolutionIndex: 5, // Vela de operación
    snrLevel: isCallSetup ? 97.6 : 102.4,
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
