import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS19Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE COMPRA - CALL):
    // 0 y 1: Caída previa
    { o: 104.0, h: 104.2, l: 101.8, c: 102.0 }, // 0: Roja 1
    { o: 102.0, h: 102.2, l: 99.4, c: 99.6 },   // 1: Roja 2
    // 2: VELA DOJI (Marca la línea horizontal en 98.00)
    { o: 98.0, h: 99.2, l: 96.8, c: 98.05 },
    // 3: Caída final / agotamiento por debajo del Doji
    { o: 97.8, h: 98.2, l: 94.6, c: 95.0 },
    // 4: Primera vela verde de recuperación
    { o: 95.0, h: 97.2, l: 94.8, c: 96.8 },
    // 5: VELA DE RUPTURA (TRIGGER: verde que cruza y cierra en 100.20, rompiendo 98.00)
    { o: 96.8, h: 100.5, l: 96.6, c: 100.2 },
    // 6: VELA DE COMERCIO (CALL ITM)
    { o: 100.2, h: 103.8, l: 100.0, c: 103.5 }
  ] : [
    // LÁMINA 3 (CONFIGURACIÓN DE VENTA - PUT):
    // 0 y 1: Subida previa
    { o: 96.0, h: 98.2, l: 95.8, c: 98.0 },   // 0: Verde 1
    { o: 98.0, h: 100.4, l: 97.8, c: 100.2 }, // 1: Verde 2
    // 2: VELA DOJI (Marca la línea horizontal en 102.00)
    { o: 102.0, h: 103.2, l: 100.8, c: 101.95 },
    // 3: Subida final / techo por encima del Doji
    { o: 102.2, h: 105.4, l: 101.8, c: 105.0 },
    // 4: Primera vela roja de reversión
    { o: 105.0, h: 105.2, l: 102.8, c: 103.0 },
    // 5: VELA DE RUPTURA (TRIGGER: roja que cruza y cierra en 99.80, rompiendo 102.00)
    { o: 103.0, h: 103.2, l: 99.5, c: 99.8 },
    // 6: VELA DE COMERCIO (PUT ITM)
    { o: 99.8, h: 100.0, l: 96.2, c: 96.5 }
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
    triggerIndex: 5, // Cierre de la vela de ruptura
    resolutionIndex: 6, // Vela de comercio
    snrLevel: isCallSetup ? 98.0 : 102.0, // Línea horizontal en la vela Doji
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
