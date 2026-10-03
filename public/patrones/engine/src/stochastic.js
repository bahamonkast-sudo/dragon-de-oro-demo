export function calculateStochastic(candles, period = 14, smoothK = 3) {
    const kValues = [];
    for (let i = period - 1; i < candles.length; i++) {
        const window = candles.slice(i - period + 1, i + 1);
        const lowestLow = Math.min(...window.map((c) => c.low));
        const highestHigh = Math.max(...window.map((c) => c.high));
        const close = candles[i].close;
        const denominator = highestHigh - lowestLow;
        const k = denominator === 0 ? 0 : ((close - lowestLow) / denominator) * 100;
        kValues.push(k);
    }
    const dValues = [];
    for (let i = smoothK - 1; i < kValues.length; i++) {
        const kWindow = kValues.slice(i - smoothK + 1, i + 1);
        const d = kWindow.reduce((sum, val) => sum + val, 0) / kWindow.length;
        dValues.push(d);
    }
    return { k: kValues, d: dValues };
}
//# sourceMappingURL=stochastic.js.map