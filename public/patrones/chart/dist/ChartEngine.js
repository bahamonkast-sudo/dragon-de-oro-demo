import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from "react";
import { LightweightCharts, LineStyle } from "lightweight-charts";
const theme = {
    colors: {
        background: "#0b0f19",
        grid: "#1e2530",
        text: "#dce4ec",
        up: "#10b981",
        down: "#ef4444",
    },
};
export const ChartEngine = ({ candles, keyLevelPrice, visibleCount, }) => {
    const chartRef = useRef(null);
    const [isRevealed, setIsRevealed] = React.useState(false);
    useEffect(() => {
        if (!chartRef.current || candles.length === 0)
            return;
        const chart = chartRef.current;
        // Build series data respecting visibleCount
        const visibleCandles = candles.slice(-visibleCount);
        chart.setOptions({
            width: "100%",
            height: "100%",
            layout: {
                background: { type: "solid", color: theme.colors.background },
                textColor: theme.colors.text,
            },
            grid: {
                vertLines: { color: theme.colors.grid },
                horzLines: { color: theme.colors.grid },
            },
            rightPriceScale: { borderColor: theme.colors.grid, scaleMargins: { top: 0.1, bottom: 0.1 } },
            timeScale: { borderTop: false, borderBottom: false, mode: "bilinear" },
            crosshair: { mode: 0 },
        });
        const lineSeries = chart.addCandleStickSeries({
            upColor: theme.colors.up,
            downColor: theme.colors.down,
            borderUpColor: theme.colors.up,
            borderDownColor: theme.colors.down,
            wickUpColor: theme.colors.up,
            wickDownColor: theme.colors.down,
        });
        lineSeries.setData(visibleCandles);
        // Add sub-panel for Stochastic Oscillator
        const stochasticPane = chart.addPane({ bottom: 30, top: 0 });
        // Calculate stochastic data
        const { kValues, dValues } = calculateStochasticOscillator(visibleCandles, 14);
        // %K line (green) in sub-panel
        const kSeries = chart.addLineSeries();
        kSeries.setData(kValues);
        kSeries.applyOptions({ color: "#10b981", lineWidth: 1, lineStyle: LineStyle.Solid });
        kSeries.applyOptions({ pane: 1 });
        // %D line (red) in sub-panel
        const dSeries = chart.addLineSeries();
        dSeries.setData(dValues);
        dSeries.applyOptions({ color: "#ef4444", lineWidth: 1, lineStyle: LineStyle.Solid });
        dSeries.applyOptions({ pane: 1 });
        // Level 80 (dashed/yellow)
        const level80 = chart.addHorizontalLine({
            value: 80,
            color: "#f59e0b",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
        });
        level80.applyOptions({ pane: 1 });
        // Level 20 (dashed/yellow)
        const level20 = chart.addHorizontalLine({
            value: 20,
            color: "#f59e0b",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
        });
        level20.applyOptions({ pane: 1 });
        // Horizontal line for key level (SNR) - yellow if provided
        if (keyLevelPrice !== undefined) {
            const keyLevel = chart.addHorizontalLine({
                value: keyLevelPrice,
                color: "#f59e0b",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
            });
            keyLevel.applyOptions({ pane: 0 });
        }
        // Smooth animation - reveal candles gradually
        const total = visibleCandles.length;
        let revealed = 0;
        const interval = setInterval(() => {
            revealed++;
            if (revealed >= total) {
                clearInterval(interval);
                setIsRevealed(true);
            }
            const progressiveData = visibleCandles.slice(0, revealed);
            lineSeries.setData(progressiveData);
        }, 30);
        return () => {
            clearInterval(interval);
            chart.removeSeries(lineSeries);
            chart.removeSeries(kSeries);
            chart.removeSeries(dSeries);
            if (keyLevelPrice !== undefined) {
                chart.removeHorizontalLine(undefined);
            }
            chart.removePane(stochasticPane);
        };
    }, [candles, keyLevelPrice, visibleCount]);
    return _jsx("div", { ref: chartRef, style: { width: "100%", height: "500px" } });
};
function calculateStochasticOscillator(candles, period = 14) {
    if (candles.length < period + 1) {
        return { kValues: [], dValues: [] };
    }
    const kValues = [];
    const dValues = [];
    for (let i = period; i < candles.length; i++) {
        const window = candles.slice(i - period, i + 1);
        const highestHigh = Math.max(...window.map((c) => c.high));
        const lowestLow = Math.min(...window.map((c) => c.low));
        const currentClose = candles[i].close;
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
    }
    // Pad kValues to include earlier candles with default value
    const paddedK = Array.from({ length: candles.length - period }, (_, i) => kValues[i] ?? 50);
    const fullK = [...Array(period).fill(50), ...paddedK];
    // Calculate %D as 3-period SMA of %K
    const sma = [];
    for (let i = 2; i < fullK.length; i++) {
        const avg = (fullK[i - 2] + fullK[i - 1] + fullK[i]) / 3;
        sma.push(avg);
    }
    // Pad sma to match candle count
    const paddedD = Array.from({ length: candles.length - period + 1 }, (_, i) => sma[i] ?? 50);
    const fullD = [...Array(period + 1).fill(50), ...paddedD];
    return { kValues: fullK, dValues: fullD };
}
export default ChartEngine;
//# sourceMappingURL=ChartEngine.js.map