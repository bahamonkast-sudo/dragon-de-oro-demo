import React from "react";
export interface Candle {
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
}
export interface ChartEngineProps {
    candles: Candle[];
    keyLevelPrice?: number;
    visibleCount: number;
}
export declare const ChartEngine: React.FC<ChartEngineProps>;
export default ChartEngine;
//# sourceMappingURL=ChartEngine.d.ts.map