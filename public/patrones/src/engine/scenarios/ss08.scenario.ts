import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS08Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // ALCISTA (Configuración de Compra)
    // 1. Mínimo 3-4 velas verdes
    { o: 94.0, h: 95.8, l: 93.8, c: 95.5 },   // 0: Verde 1
    { o: 95.5, h: 97.2, l: 95.2, c: 97.0 },   // 1: Verde 2
    { o: 97.0, h: 99.8, l: 96.8, c: 99.5 },   // 2: Verde 3
    // 2. Patrón de color (Verde - Rojo - Verde - Rojo)
    { o: 99.5, h: 103.2, l: 99.4, c: 102.8 }, // 3: Verde A
    { o: 102.8, h: 103.0, l: 99.8, c: 100.2 },// 4: Rojo A
    { o: 100.2, h: 103.0, l: 100.0, c: 102.6 },// 5: Verde B
    { o: 102.6, h: 103.2, l: 99.6, c: 100.0 },// 6: Rojo B
    // 3. Vela que rompe el patrón de color (repite rojo y cae) -> TRIGGER
    { o: 100.0, h: 100.2, l: 96.8, c: 97.2 }, // 7: Rojo ruptura
    // 4. Vela de operación (CALL)
    { o: 97.2, h: 99.6, l: 97.0, c: 99.2 }    // 8: Entrada CALL (ITM)
  ] : [
    // BAJISTA (Configuración de Venta)
    // 1. Mínimo 3-4 velas rojas
    { o: 106.0, h: 106.2, l: 104.2, c: 104.5 }, // 0: Roja 1
    { o: 104.5, h: 104.8, l: 102.8, c: 103.0 }, // 1: Roja 2
    { o: 103.0, h: 103.2, l: 100.2, c: 100.5 }, // 2: Roja 3
    // 2. Patrón de color (Rojo - Verde - Rojo - Verde)
    { o: 100.5, h: 100.6, l: 96.8, c: 97.2 },   // 3: Rojo A
    { o: 97.2, h: 100.2, l: 97.0, c: 99.8 },    // 4: Verde A
    { o: 99.8, h: 100.0, l: 97.0, c: 97.4 },    // 5: Rojo B
    { o: 97.4, h: 100.4, l: 97.2, c: 100.0 },   // 6: Verde B
    // 3. Vela que rompe el patrón de color (repite verde y sube) -> TRIGGER
    { o: 100.0, h: 103.2, l: 99.8, c: 102.8 },  // 7: Verde ruptura
    // 4. Vela de operación (PUT)
    { o: 102.8, h: 103.0, l: 100.4, c: 100.8 }  // 8: Entrada PUT (ITM)
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
    triggerIndex: 7, // Decisión tras cerrar la vela que rompe la alternancia
    resolutionIndex: 8, // Vela de entrada
    snrLevel: isCall ? 100.0 : 100.0, // Base o techo de la caja de alternancia
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
