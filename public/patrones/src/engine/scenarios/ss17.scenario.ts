import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS17Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA DEL LIBRO (CONFIGURACIÓN ALCISTA - CALL):
    // 0: Vela Roja Sin Cabeza (low === close === 98.00, mecha superior alta hasta 102.00)
    { o: 100.5, h: 102.0, l: 98.0, c: 98.0 },
    // 1: Vela Verde Sin Cola (TRIGGER: open === low === 98.00, mecha superior hasta 100.20)
    { o: 98.0, h: 100.2, l: 98.0, c: 99.4 },
    // 2: VELA COMERCIAL ALCISTA (CALL ITM)
    { o: 99.4, h: 103.2, l: 99.2, c: 102.8 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA BAJISTA (PUT):
    // 0: Vela Verde Sin Mecha Superior (high === close === 102.00, mecha inferior hasta 98.00)
    { o: 99.5, h: 102.0, l: 98.0, c: 102.0 },
    // 1: Vela Roja Sin Mecha Superior (TRIGGER: open === high === 102.00, mecha inferior hasta 99.80)
    { o: 102.0, h: 102.0, l: 99.8, c: 100.6 },
    // 2: VELA COMERCIAL BAJISTA (PUT ITM)
    { o: 100.6, h: 100.8, l: 96.8, c: 97.2 }
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
    triggerIndex: 1, // Al cerrar la vela sin cola
    resolutionIndex: 2, // Vela de operación comercial
    snrLevel: isCallSetup ? 98.0 : 102.0, // Nivel plano común
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
