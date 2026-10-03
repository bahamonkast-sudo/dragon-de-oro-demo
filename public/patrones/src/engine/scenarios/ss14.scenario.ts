import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS14Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isPutSetup = direction === 'PUT';

  const raw = isPutSetup ? [
    // LÁMINA 2 DEL LIBRO (CONFIGURACIÓN DE VENTA - PUT):
    // 0: Vela Verde inicial
    { o: 98.0, h: 101.4, l: 97.6, c: 101.2 },
    // 1: Vela Roja (mínimo en 99.00)
    { o: 101.2, h: 101.5, l: 99.0, c: 99.4 },
    // 2: Segunda Vela Verde (TRIGGER): su mecha inferior desciende hasta 98.20 perforando los 99.00
    { o: 99.4, h: 101.8, l: 98.2, c: 101.2 },
    // 3: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 101.2, h: 101.4, l: 98.6, c: 99.0 }
  ] : [
    // CONFIGURACIÓN SIMÉTRICA DE COMPRA (CALL):
    // 0: Vela Roja inicial
    { o: 102.0, h: 102.4, l: 98.6, c: 98.8 },
    // 1: Vela Verde (máximo en 101.00)
    { o: 98.8, h: 101.0, l: 98.5, c: 100.6 },
    // 2: Segunda Vela Roja (TRIGGER): su mecha superior sube hasta 101.80 perforando los 101.00
    { o: 100.6, h: 101.8, l: 98.2, c: 98.8 },
    // 3: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 98.8, h: 101.4, l: 98.6, c: 101.0 }
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
    triggerIndex: 2, // Tras cerrar la vela cuya mecha rompió el nivel
    resolutionIndex: 3, // Vela de operación
    snrLevel: isPutSetup ? 99.0 : 101.0, // Nivel que la mecha rompe
    expectedAction: isPutSetup ? 'PUT' : 'CALL',
  };
}
