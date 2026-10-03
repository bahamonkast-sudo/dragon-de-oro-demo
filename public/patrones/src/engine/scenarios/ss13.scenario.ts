import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS13Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // LÁMINA 2: Compra (CALL) -> Mínimo 3 velas rojas consecutivas -> Doji Verde -> Operación CALL (Verde)
    { o: 104.0, h: 104.2, l: 101.8, c: 102.0 }, // 0: Roja 1
    { o: 102.0, h: 102.2, l: 99.4, c: 99.6 },   // 1: Roja 2
    { o: 99.6, h: 99.8, l: 97.4, c: 97.8 },     // 2: Roja 3 (fondo)
    // 3: DOJI VERDE (Trigger: apertura y cierre idénticos con sesgo comprador, mechas simétricas)
    { o: 97.8, h: 99.6, l: 96.0, c: 97.85 },
    // 4: VELA DE OPERACIÓN (CALL ITM)
    { o: 97.85, h: 101.5, l: 97.6, c: 101.0 }
  ] : [
    // LÁMINA 3: Venta (PUT) -> Mínimo 3 velas verdes consecutivas -> Doji Rojo -> Operación PUT (Roja)
    { o: 96.0, h: 98.2, l: 95.8, c: 98.0 },   // 0: Verde 1
    { o: 98.0, h: 100.4, l: 97.8, c: 100.2 }, // 1: Verde 2
    { o: 100.2, h: 103.0, l: 100.0, c: 102.8 },// 2: Verde 3 (techo)
    // 3: DOJI ROJO (Trigger: apertura y cierre idénticos con sesgo vendedor, mechas simétricas)
    { o: 102.8, h: 104.6, l: 101.0, c: 102.75 },
    // 4: VELA DE OPERACIÓN (PUT ITM)
    { o: 102.75, h: 103.0, l: 99.2, c: 99.6 }
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
    triggerIndex: 3, // Se decide al cierre del Doji contrario
    resolutionIndex: 4, // Vela de operación de reversión
    snrLevel: isCall ? 97.8 : 102.8,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
