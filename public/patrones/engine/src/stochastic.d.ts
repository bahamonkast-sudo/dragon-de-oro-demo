export interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
}
export interface StochasticResult {
    k: number[];
    d: number[];
}
export declare function calculateStochastic(candles: Candle[], period?: number, smoothK?: number): StochasticResult;
//# sourceMappingURL=stochastic.d.ts.map