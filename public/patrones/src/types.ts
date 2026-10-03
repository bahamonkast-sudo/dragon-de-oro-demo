export interface Candle {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type MtgPolicy = "NO_MTG" | "1_STEP" | "2_STEP";
export type TradeAction = "CALL" | "PUT";

export interface PatternDefinition {
  id: string;
  code: string;
  name: string;
  marketType: string;
  tradeType: "Continuación" | "Reversión" | string;
  requirements: string[];
  snr?: {
    hasKeyLevel: boolean;
    breakoutType?: string;
    description?: string;
  };
  stochasticRule?: {
    requiredCondition?: string;
    description?: string;
  };
  riskManagement?: {
    policy: MtgPolicy;
    note: string;
  };
  practice?: {
    keyLevelPrice?: number;
    baseCandles: Candle[];
    triggerIndex: number;
    resolutionCandle: Candle;
    expectedAction: TradeAction;
    explanation: string;
  };
}

export type STPattern = PatternDefinition;
export const STPattern = {} as unknown as PatternDefinition;