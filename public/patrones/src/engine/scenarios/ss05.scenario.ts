import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS05Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // ALCISTA (Imagen 2 del libro)
    // 4 verdes consecutivas impulsivas
    { o: 95.0, h: 97.2, l: 94.8, c: 97.0 },  // 0: Verde 1
    { o: 97.0, h: 98.6, l: 96.8, c: 98.5 },  // 1: Verde 2
    { o: 98.5, h: 101.4, l: 98.4, c: 101.0 }, // 2: Verde 3
    { o: 101.0, h: 104.0, l: 100.8, c: 103.8 }, // 3: Verde 4 (techo del impulso)
    // 2 velas opuestas (rojas) de corrección (techo SNR en 104.00)
    { o: 103.8, h: 104.0, l: 101.5, c: 101.8 }, // 4: Roja 1 opuesta
    { o: 101.8, h: 102.2, l: 99.2, c: 99.6 },   // 5: Roja 2 opuesta
    // Vela verde de recuperación que NO ROMPE la línea horizontal (Trigger)
    { o: 99.6, h: 103.6, l: 99.4, c: 103.2 },  // 6: Verde no rompe 104.00
    // Vela de Operación (CALL)
    { o: 103.2, h: 105.8, l: 103.0, c: 105.4 }  // 7: Entrada CALL (ITM)
  ] : [
    // BAJISTA (Imagen 3 del libro)
    // 4 rojas consecutivas impulsivas
    { o: 105.0, h: 105.2, l: 102.8, c: 103.0 }, // 0: Roja 1
    { o: 103.0, h: 103.2, l: 101.4, c: 101.5 }, // 1: Roja 2
    { o: 101.5, h: 101.6, l: 98.6, c: 99.0 },   // 2: Roja 3
    { o: 99.0, h: 99.2, l: 96.0, c: 96.2 },    // 3: Roja 4 (suelo del impulso)
    // 2 velas opuestas (verdes) de corrección (piso SNR en 96.00)
    { o: 96.2, h: 98.5, l: 96.0, c: 98.2 },    // 4: Verde 1 opuesta
    { o: 98.2, h: 100.8, l: 98.0, c: 100.4 },  // 5: Verde 2 opuesta
    // Vela roja de recuperación que NO ROMPE la línea horizontal (Trigger)
    { o: 100.4, h: 100.6, l: 96.4, c: 96.8 },  // 6: Roja no rompe 96.00
    // Vela de Operación (PUT)
    { o: 96.8, h: 97.0, l: 94.2, c: 94.6 }     // 7: Entrada PUT (ITM)
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
    triggerIndex: 6, // Se decide tras el cierre de la vela que no rompió la línea
    resolutionIndex: 7, // Vela de entrada a favor de la tendencia
    snrLevel: isCall ? 104.0 : 96.0,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
