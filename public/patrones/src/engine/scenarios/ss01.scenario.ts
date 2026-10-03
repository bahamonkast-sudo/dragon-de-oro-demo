import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS01Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    { o: 99.0, h: 102.2, l: 98.8, c: 102.0 },  // 0: Verde previa
    { o: 102.0, h: 102.8, l: 100.8, c: 101.0 }, // 1: Roja 1
    { o: 101.0, h: 101.4, l: 98.2, c: 98.6 },   // 2: Roja 2 (SNR en 101.00)
    { o: 98.6, h: 99.0, l: 96.8, c: 97.2 },     // 3: Roja valle
    { o: 97.2, h: 98.8, l: 97.0, c: 98.4 },     // 4: Verde retorno
    { o: 98.4, h: 102.3, l: 98.2, c: 101.8 },   // 5: Trigger Ruptura
    { o: 101.8, h: 104.2, l: 101.6, c: 103.8 }  // 6: Entrada CALL
  ] : [
    { o: 101.0, h: 101.3, l: 98.0, c: 98.2 },   // 0: Roja previa
    { o: 98.2, h: 100.2, l: 98.0, c: 99.5 },    // 1: Verde 1
    { o: 99.5, h: 102.4, l: 99.4, c: 102.0 },   // 2: Verde 2 (SNR en 99.50)
    { o: 102.0, h: 103.5, l: 101.8, c: 103.0 }, // 3: Impulso
    { o: 103.0, h: 103.2, l: 101.2, c: 101.5 }, // 4: Roja retroceso
    { o: 101.5, h: 101.6, l: 98.5, c: 98.8 },   // 5: Trigger Ruptura bajista
    { o: 98.8, h: 99.0, l: 96.5, c: 96.8 }      // 6: Entrada PUT
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
    triggerIndex: 5,
    resolutionIndex: 6,
    snrLevel: isCall ? 101.0 : 99.5,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
