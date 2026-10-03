import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS24Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE COMPRA - CALL):
    // 4 velas rojas con cuerpo en crecimiento progresivo
    { o: 106.0, h: 106.2, l: 104.2, c: 104.4 }, // 0: Vela 1 (Delta: 1.6)
    { o: 104.4, h: 104.8, l: 101.8, c: 102.2 }, // 1: Vela 2 (Delta: 2.2)
    { o: 102.2, h: 102.4, l: 98.6,  c: 99.0 },  // 2: Vela 3 (Delta: 3.2)
    // 3: Vela 4 CLÍMAX (TRIGGER: Delta masivo de 5.5, cierra en 93.50)
    { o: 99.0,  h: 99.2,  l: 93.3,  c: 93.5 },
    // 4: VELA DE OPERACIÓN (CALL ITM)
    { o: 93.5,  h: 96.8,  l: 93.2,  c: 96.5 }
  ] : [
    // LÁMINA 3 (CONFIGURACIÓN DE VENTA - PUT):
    // 4 velas verdes con cuerpo en crecimiento progresivo
    { o: 94.0,  h: 95.8,  l: 93.8,  c: 95.6 },  // 0: Vela 1 (Delta: 1.6)
    { o: 95.6,  h: 98.2,  l: 95.2,  c: 97.8 },  // 1: Vela 2 (Delta: 2.2)
    { o: 97.8,  h: 101.4, l: 97.5,  c: 101.0 }, // 2: Vela 3 (Delta: 3.2)
    // 3: Vela 4 CLÍMAX (TRIGGER: Delta masivo de 5.5, cierra en 106.50)
    { o: 101.0, h: 106.8, l: 100.8, c: 106.5 },
    // 4: VELA COMERCIAL DE OPERACIÓN (PUT ITM)
    { o: 106.5, h: 106.8, l: 103.2, c: 103.5 }
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
    triggerIndex: 3, // Al cierre de la 4ª vela clímax
    resolutionIndex: 4, // Vela comercial de reversión
    snrLevel: isCallSetup ? 93.5 : 106.5,
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
