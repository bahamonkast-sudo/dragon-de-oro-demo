import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS21Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 2 (CONFIGURACIÓN DE COMPRA - CALL):
    // 0 a 4: Mínimo 5 velas del mismo color en tendencia bajista
    { o: 105.0, h: 105.2, l: 102.8, c: 103.0 }, // 0: Roja 1
    { o: 103.0, h: 103.2, l: 100.0, c: 100.2 }, // 1: Roja 2
    { o: 100.2, h: 100.4, l: 99.4, c: 99.5 },   // 2: Roja 3 (pausa/doji)
    { o: 99.5, h: 99.8, l: 96.0, c: 96.4 },     // 3: Roja 4
    { o: 96.4, h: 96.6, l: 94.0, c: 94.2 },     // 4: Roja 5
    // 5: VELA DE COLOR OPUESTO (Verde: techo canal en 97.20, suelo en 94.00)
    { o: 94.2, h: 97.2, l: 94.0, c: 96.8 },
    // 6 y 7: Consolidación interna en el canal
    { o: 96.8, h: 97.0, l: 95.0, c: 95.2 },     // 6: Roja
    { o: 95.2, h: 97.0, l: 94.8, c: 96.6 },     // 7: Verde
    // 8: VELA DE RUPTURA (TRIGGER: verde que rompe los 97.20 y cierra en 99.50)
    { o: 96.6, h: 99.8, l: 96.4, c: 99.5 },
    // 9: VELA DE OPERACIÓN (CALL ITM)
    { o: 99.5, h: 103.4, l: 99.2, c: 103.0 }
  ] : [
    // LÁMINA 3 (CONFIGURACIÓN DE VENTA - PUT):
    // 0 a 4: Mínimo 5 velas del mismo color en tendencia alcista
    { o: 95.0, h: 97.2, l: 94.8, c: 97.0 },     // 0: Verde 1
    { o: 97.0, h: 100.0, l: 96.8, c: 99.8 },    // 1: Verde 2
    { o: 99.8, h: 100.6, l: 99.6, c: 100.5 },   // 2: Verde 3 (pausa/doji)
    { o: 100.5, h: 104.0, l: 100.2, c: 103.6 }, // 3: Verde 4
    { o: 103.6, h: 106.0, l: 103.4, c: 105.8 }, // 4: Verde 5
    // 5: VELA DE COLOR OPUESTO (Roja: techo en 106.00, suelo canal en 102.80)
    { o: 105.8, h: 106.0, l: 102.8, c: 103.2 },
    // 6 y 7: Consolidación interna en el canal
    { o: 103.2, h: 105.0, l: 103.0, c: 104.8 }, // 6: Verde
    { o: 104.8, h: 105.0, l: 103.0, c: 103.4 }, // 7: Roja
    // 8: VELA DE RUPTURA (TRIGGER: roja que rompe los 102.80 y cierra en 100.50)
    { o: 103.4, h: 103.6, l: 100.2, c: 100.5 },
    // 9: VELA DE OPERACIÓN (PUT ITM)
    { o: 100.5, h: 100.8, l: 96.6, c: 97.0 }
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
    triggerIndex: 8,
    resolutionIndex: 9,
    snrLevel: isCallSetup ? 97.2 : 102.8,
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
