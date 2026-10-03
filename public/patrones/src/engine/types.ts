export interface CandlestickBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SimulationScenario {
  candles: CandlestickBar[];
  triggerIndex: number;
  resolutionIndex: number;
  snrLevel: number;
  expectedAction: 'CALL' | 'PUT';
}

export type ScenarioBuilder = (direction: 'CALL' | 'PUT') => SimulationScenario;
