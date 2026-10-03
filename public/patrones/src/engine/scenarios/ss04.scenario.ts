import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS04Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // ALCISTA: Contexto bajista -> Envolvente Alcista -> Vela Verde Sin Cola -> Operación CALL
    { o: 101.8, h: 102.0, l: 100.5, c: 100.8 }, // 0: Contexto
    { o: 100.6, h: 101.2, l: 99.0, c: 99.4 },   // 1: Roja engullida
    { o: 99.2, h: 101.8, l: 98.8, c: 101.5 },   // 2: VERDE ENVOLVENTE (Bullish Engulfing)
    { o: 101.5, h: 103.2, l: 101.5, c: 103.0 }, // 3: VERDE SIN COLA (low == open) - TRIGGER
    { o: 103.0, h: 104.5, l: 102.8, c: 104.2 }  // 4: ENTRADA CALL (ITM)
  ] : [
    // BAJISTA: Contexto alcista -> Envolvente Bajista -> Vela Roja Sin Cola -> Operación PUT
    { o: 98.2, h: 99.5, l: 98.0, c: 99.2 },    // 0: Contexto
    { o: 99.4, h: 101.0, l: 99.0, c: 100.6 },  // 1: Verde engullida
    { o: 100.8, h: 101.2, l: 98.2, c: 98.5 },  // 2: ROJA ENVOLVENTE (Bearish Engulfing)
    { o: 98.5, h: 98.5, l: 96.8, c: 97.0 },    // 3: ROJA SIN COLA (high == open) - TRIGGER
    { o: 97.0, h: 97.2, l: 95.5, c: 95.8 }     // 4: ENTRADA PUT (ITM)
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
    triggerIndex: 3,
    resolutionIndex: 4,
    snrLevel: isCall ? 101.5 : 98.5,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
