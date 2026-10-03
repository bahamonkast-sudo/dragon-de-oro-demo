export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}
export type TradeAction = "CALL" | "PUT";
export type MtgPolicy = "NO_MTG" | "1_STEP" | "2_STEP";
export interface PatternDefinition {
    id: string;
    code: string;
    name: string;
    marketType: string;
    tradeType: string;
    requirements: string[];
    snr: number;
    stochasticRule: boolean;
    riskManagement: string;
    practice: boolean;
}
export interface EvaluationResult {
    isWin: boolean;
    userAction: TradeAction;
    expectedAction: TradeAction;
    feedbackMessage: string;
}
//# sourceMappingURL=types.d.ts.map