import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS09Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];

  // direction === 'CALL' corresponde al diagrama 1 ("CONFIGURACIÓN DE COMPRA - ALZA")
  // donde el mercado sube, confirma vela verde y la operación es PUT (roja).
  // direction === 'PUT' corresponde al diagrama 2 ("CONFIGURACIÓN DE VENTA - BAJA")
  // donde el mercado cae, confirma vela roja y la operación es CALL (verde).
  const isSetupBull = direction === 'CALL';

  const raw = isSetupBull ? [
    // LÁMINA 1: Contexto Alcista -> Caja de Alternancia -> Quiebre Rojo -> SS8 Trade Verde -> Seguida Verde -> VELA DE OPERACIÓN ROJA (PUT)
    { o: 93.0, h: 94.8, l: 92.8, c: 94.5 },   // 0: Impulso verde 1
    { o: 94.5, h: 96.2, l: 94.2, c: 96.0 },   // 1: Impulso verde 2
    { o: 96.0, h: 98.4, l: 95.8, c: 98.2 },   // 2: Impulso verde 3
    // Caja de alternancia SS8 (3 a 6)
    { o: 98.2, h: 101.5, l: 98.0, c: 101.2 }, // 3: Verde A
    { o: 101.2, h: 101.4, l: 98.4, c: 98.6 }, // 4: Rojo A
    { o: 98.6, h: 101.4, l: 98.4, c: 101.0 }, // 5: Verde B
    { o: 101.0, h: 101.2, l: 98.2, c: 98.5 }, // 6: Rojo B
    // Ruptura SS8
    { o: 98.5, h: 98.6, l: 95.8, c: 96.2 },   // 7: Rojo ruptura SS8
    // SS8 Trade Candle (Verde ganada)
    { o: 96.2, h: 99.0, l: 96.0, c: 98.8 },   // 8: SS8 Trade Verde
    // Trigger SS9: Seguida del mismo color (Verde)
    { o: 98.8, h: 101.8, l: 98.6, c: 101.5 }, // 9: Verde Trigger SS9
    // Vela de Operación SS9: VELA ROJA (Giro a la baja)
    { o: 101.5, h: 101.6, l: 97.4, c: 97.8 }  // 10: Operación PUT
  ] : [
    // LÁMINA 2: Contexto Bajista -> Caja de Alternancia -> Quiebre Verde -> SS8 Trade Rojo -> Seguida Roja -> VELA DE OPERACIÓN VERDE (CALL)
    { o: 107.0, h: 107.2, l: 105.2, c: 105.5 }, // 0: Impulso rojo 1
    { o: 105.5, h: 105.8, l: 103.8, c: 104.0 }, // 1: Impulso rojo 2
    { o: 104.0, h: 104.2, l: 101.6, c: 101.8 }, // 2: Impulso rojo 3
    // Caja de alternancia SS8 (3 a 6)
    { o: 101.8, h: 102.0, l: 98.6, c: 98.8 },   // 3: Rojo A
    { o: 98.8, h: 101.6, l: 98.6, c: 101.4 },   // 4: Verde A
    { o: 101.4, h: 101.6, l: 98.6, c: 99.0 },   // 5: Rojo B
    { o: 99.0, h: 101.8, l: 98.8, c: 101.5 },   // 6: Verde B
    // Ruptura SS8
    { o: 101.5, h: 104.2, l: 101.3, c: 103.8 }, // 7: Verde ruptura SS8
    // SS8 Trade Candle (Roja ganada)
    { o: 103.8, h: 104.0, l: 101.0, c: 101.2 }, // 8: SS8 Trade Rojo
    // Trigger SS9: Seguida del mismo color (Roja)
    { o: 101.2, h: 101.4, l: 98.2, c: 98.5 },   // 9: Roja Trigger SS9
    // Vela de Operación SS9: VELA VERDE (Giro al alza)
    { o: 98.5, h: 102.4, l: 98.2, c: 102.0 }   // 10: Operación CALL
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
    triggerIndex: 9,
    resolutionIndex: 10,
    snrLevel: isSetupBull ? 101.5 : 98.5,
    // En el setup alcista se opera PUT (vela roja); en el bajista se opera CALL (vela verde)
    expectedAction: isSetupBull ? 'PUT' : 'CALL',
  };
}
