import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS16Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA DEL LIBRO (CONFIGURACIÓN ALCISTA - CALL):
    // 0: Martillo Invertido (cuerpo abajo, mecha superior larga verde)
    { o: 98.0, h: 103.6, l: 97.8, c: 99.4 },
    // 1: Martillo (TRIGGER: cuerpo arriba, mecha inferior larga de rechazo)
    { o: 100.0, h: 101.6, l: 96.0, c: 101.4 },
    // 2: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 101.4, h: 104.5, l: 101.2, c: 104.2 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA BAJISTA:
    // 0: Martillo normal bajista
    { o: 102.0, h: 102.2, l: 97.4, c: 100.6 },
    // 1: Martillo Invertido bajista (TRIGGER)
    { o: 100.0, h: 104.0, l: 98.4, c: 98.6 },
    // 2: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 98.6, h: 98.8, l: 95.5, c: 95.8 }
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
    triggerIndex: 1, // Al cerrar la segunda vela martillo
    resolutionIndex: 2, // Vela de operación
    snrLevel: isCallSetup ? 100.0 : 100.0,
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
