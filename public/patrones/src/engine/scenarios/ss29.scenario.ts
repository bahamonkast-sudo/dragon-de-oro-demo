import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS29Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCallSetup = direction === 'CALL';

  const raw = isCallSetup ? [
    // LÁMINA 3 (CONFIGURACIÓN DE COMPRA - ALZA): Verde -> Rojo -> Verde -> Rojo -> CALL
    // 0: Verde 1
    { o: 98.0, h: 101.4, l: 97.4, c: 101.2 },
    // 1: Rojo 1
    { o: 101.2, h: 102.2, l: 97.8, c: 98.0 },
    // 2: Verde 2
    { o: 98.0, h: 101.3, l: 97.8, c: 101.0 },
    // 3: Rojo 2 (TRIGGER: Cierre de la alternancia en rango)
    { o: 101.0, h: 101.5, l: 97.0, c: 97.8 },
    // 4: VELA DE OPERACIÓN ALCISTA (CALL ITM)
    { o: 97.8, h: 101.8, l: 97.2, c: 101.5 }
  ] : [
    // LÁMINA 2 (CONFIGURACIÓN DE VENTA - BAJA): Rojo -> Verde -> Rojo -> Verde -> PUT
    // 0: Rojo 1
    { o: 101.5, h: 101.8, l: 97.6, c: 98.0 },
    // 1: Verde 1
    { o: 98.0, h: 102.4, l: 97.5, c: 101.4 },
    // 2: Rojo 2
    { o: 101.4, h: 101.6, l: 97.2, c: 98.2 },
    // 3: Verde 2 (TRIGGER: Cierre de la alternancia en rango)
    { o: 98.2, h: 101.5, l: 96.6, c: 101.2 },
    // 4: VELA DE OPERACIÓN BAJISTA (PUT ITM)
    { o: 101.2, h: 101.6, l: 96.8, c: 97.4 }
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
    triggerIndex: 3, // Cierre de la 4ª vela alternante
    resolutionIndex: 4, // Vela comercial de operación
    snrLevel: isCallSetup ? 97.8 : 101.2,
    expectedAction: isCallSetup ? 'CALL' : 'PUT',
  };
}
