import { SimulationScenario, CandlestickBar } from '../types';

export function buildSS11Scenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isCall = direction === 'CALL';

  const raw = isCall ? [
    // LÁMINA 2: Vela Verde previa (cierra en 100.00) -> Gap Bajista (abre en 98.60) -> Sube a llenar brecha (cierra verde en 100.80)
    { o: 97.0, h: 100.5, l: 96.8, c: 100.0 }, // 0: Vela Verde previa
    { o: 98.6, h: 101.5, l: 98.4, c: 100.8 }  // 1: Apertura con gap bajista y cierre VERDE (CALL ITM)
  ] : [
    // LÁMINA 3: Vela Roja previa (cierra en 100.00) -> Gap Alcista (abre en 101.40) -> Baja a llenar brecha (cierra roja en 99.20)
    { o: 103.0, h: 103.4, l: 99.6, c: 100.0 }, // 0: Vela Roja previa
    { o: 101.4, h: 101.6, l: 98.8, c: 99.2 }  // 1: Apertura con gap alcista y cierre ROJA (PUT ITM)
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
    triggerIndex: 0, // El trigger ocurre en la apertura de la vela 1 al detectar el gap contra la vela 0
    resolutionIndex: 1, // La misma vela 1 es la vela de operación que llena la brecha
    snrLevel: 100.0, // Nivel del cierre previo a rellenar
    expectedAction: isCall ? 'CALL' : 'PUT',
  };
}
