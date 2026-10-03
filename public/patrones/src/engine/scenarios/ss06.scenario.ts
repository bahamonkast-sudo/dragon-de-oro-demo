import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS06Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // ALCISTA: 4 verdes -> 1 roja opuesta -> Ruptura estricta con cuerpo -> CALL
    { o: 95.0, h: 97.0, l: 94.8, c: 96.8 },   // 0: Verde 1
    { o: 96.8, h: 98.6, l: 96.6, c: 98.4 },   // 1: Verde 2
    { o: 98.4, h: 101.2, l: 98.2, c: 101.0 }, // 2: Verde 3
    { o: 101.0, h: 103.0, l: 100.8, c: 102.8 },// 3: Verde 4 (techo 103.00)
    // 4: 1 SOLA VELA ROJA OPUESTA (su mecha/apertura marca la línea horizontal en 103.00)
    { o: 102.8, h: 103.0, l: 101.2, c: 101.5 },
    // 5: VELA DE RUPTURA ESTRICTA CON CUERPO (cierra en 104.40, superando 103.00 con cuerpo entero) -> TRIGGER
    { o: 101.5, h: 104.6, l: 101.3, c: 104.4 },
    // 6: VELA DE OPERACIÓN (CALL ITM)
    { o: 104.4, h: 106.2, l: 104.2, c: 105.8 }
  ] : [
    // BAJISTA: 4 rojas -> 1 verde opuesta -> Ruptura estricta con cuerpo -> PUT
    { o: 105.0, h: 105.2, l: 103.0, c: 103.2 }, // 0: Roja 1
    { o: 103.2, h: 103.4, l: 101.4, c: 101.6 }, // 1: Roja 2
    { o: 101.6, h: 101.8, l: 98.8, c: 99.0 },   // 2: Roja 3
    { o: 99.0, h: 99.2, l: 97.0, c: 97.2 },    // 3: Roja 4 (suelo 97.00)
    // 4: 1 SOLA VELA VERDE OPUESTA (su base marca la línea horizontal en 97.00)
    { o: 97.2, h: 98.6, l: 97.0, c: 98.4 },
    // 5: VELA DE RUPTURA ESTRICTA CON CUERPO (cierra en 95.60, rompiendo con cuerpo neto) -> TRIGGER
    { o: 98.4, h: 98.6, l: 95.4, c: 95.6 },
    // 6: VELA DE OPERACIÓN (PUT ITM)
    { o: 95.6, h: 95.8, l: 93.8, c: 94.2 }
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
    triggerIndex: 5, // Se decide en el cierre de la vela de ruptura con cuerpo
    resolutionIndex: 6, // Vela de entrada
    snrLevel: isCall ? 103.0 : 97.0,
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
