import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS10Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2: GAP UP (Operación 1: CALL -> Operación 2: PUT para relleno)
    // Vela 0: Verde previa (cierra en 100.00)
    { o: 97.5, h: 100.2, l: 97.2, c: 100.0 },
    // Vela 1: Salto GAP UP: abre arriba en 101.20 y cierra verde en 103.00 (1ª Operación CALL ITM)
    { o: 101.2, h: 103.5, l: 100.8, c: 103.0 },
    // Vela 2: Relleno del GAP: Vela roja que desciende a buscar 100.00 (2ª Operación PUT ITM)
    { o: 103.0, h: 103.4, l: 99.6, c: 100.2 }
  ] : [
    // LÁMINA 3: GAP DOWN (Operación 1: PUT -> Operación 2: CALL para relleno)
    // Vela 0: Roja previa (cierra en 100.00)
    { o: 102.5, h: 102.8, l: 99.8, c: 100.0 },
    // Vela 1: Salto GAP DOWN: abre abajo en 98.80 y cierra roja en 97.00 (1ª Operación PUT ITM)
    { o: 98.8, h: 99.2, l: 96.5, c: 97.0 },
    // Vela 2: Relleno del GAP: Vela verde que sube a buscar 100.00 (2ª Operación CALL ITM)
    { o: 97.0, h: 100.4, l: 96.8, c: 99.8 }
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
    triggerIndex: 1, // Se evalúa tras ver la 1ª vela del gap formada
    resolutionIndex: 2, // Se resuelve con la vela de relleno
    snrLevel: isCallSetup ? 100.0 : 100.0, // Nivel del salto del gap
    expectedAction: isCallSetup ? 'PUT' : 'CALL', // Operación de reversión de relleno
  };
}
