export type TradeAction = "CALL" | "PUT";
export interface PatternDefinition {
    id: string;
    code: string;
    name: string;
    classification: {
        market: string;
        tradeType: TradeAction;
    };
    requirements: string[];
    snrRule: {
        nivel: string;
        tipoRuptura: string;
    };
    stochRule: string;
    mtgPolicy: "NO_MTG" | "1_STEP" | "2_STEPS";
    simulation: {
        velasBase: number;
        triggerIndex: number;
        resolutionCandle: number;
    };
}
export interface EvaluationResult {
    passed: boolean;
    message: string;
    expectedAction: TradeAction;
    appliedMTG: boolean;
}
export declare function evaluateDecision(pattern: PatternDefinition, userAction: TradeAction): EvaluationResult;
//# sourceMappingURL=validator.d.ts.map