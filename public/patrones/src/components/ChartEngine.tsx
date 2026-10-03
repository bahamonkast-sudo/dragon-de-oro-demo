import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { usePatterns } from '../data/patterns';
import { buildScenarioForPattern, CandlestickBar } from '../engine/candlestickBuilder';

export const ChartEngine: React.FC = () => {
  const { selectedPattern } = usePatterns();
  const [direction, setDirection] = useState<'CALL' | 'PUT'>('CALL');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const timerRef = useRef<any>(null);
  const fullCandlesRef = useRef<CandlestickBar[]>([]);

  const handleSelectDirection = (dir: 'CALL' | 'PUT') => {
    setDirection(dir);
    window.dispatchEvent(new CustomEvent('direction-changed', {
      detail: { direction: dir }
    }));
  };

  const renderRangeBox = () => {
    const chart = chartApiRef.current;
    const series = seriesRef.current;
    const canvas = canvasOverlayRef.current;
    const container = chartContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pid = (selectedPattern?.id || selectedPattern?.code || '').toLowerCase();
    
    if (pid === 'ss08' || pid === 'ss09') {
      if (!chart || !series) return;
      const candles = fullCandlesRef.current;
      if (candles.length < 7) return;

      const boxCandles = candles.slice(3, 7);
      const startTime = boxCandles[0].time;
      const endTime = boxCandles[boxCandles.length - 1].time;

      const highestPrice = Math.max(...boxCandles.map((c) => c.high));
      const lowestPrice = Math.min(...boxCandles.map((c) => c.low));

      const timeScale = chart.timeScale();
      const x1 = timeScale.timeToCoordinate(startTime as any);
      const x2 = timeScale.timeToCoordinate(endTime as any);
      const y1 = series.priceToCoordinate(highestPrice);
      const y2 = series.priceToCoordinate(lowestPrice);

      if (x1 !== null && x2 !== null && y1 !== null && y2 !== null) {
        const paddingX = 18;
        const paddingY = 6;
        const rectX = Math.min(x1, x2) - paddingX;
        const rectY = Math.min(y1, y2) - paddingY;
        const rectW = Math.abs(x2 - x1) + (paddingX * 2);
        const rectH = Math.abs(y2 - y1) + (paddingY * 2);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(rectX, rectY, rectW, rectH);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(rectX, rectY, rectW, rectH);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('PATRÓN DE COLOR (SS8)', rectX + 6, rectY - 4);
      }
    }
  };

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el || !selectedPattern) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (chartApiRef.current) {
      try { chartApiRef.current.remove(); } catch (err) {}
      chartApiRef.current = null;
      seriesRef.current = null;
    }

    const width = el.clientWidth > 50 ? el.clientWidth : 750;
    const height = el.clientHeight > 50 ? el.clientHeight : 480;

    const pid = (selectedPattern?.id || selectedPattern?.code || '').toLowerCase();
    const isSmall = ['ss10', 'ss11', 'ss12', 'ss13', 'ss14', 'ss15', 'ss16', 'ss17', 'ss18', 'ss24', 'ss25', 'ss26', 'ss27', 'ss28', 'ss29', 'ss30'].includes(pid);

    const chart = createChart(el, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#080c14' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#141d2e' },
        horzLines: { color: '#141d2e' },
      },
      crosshair: { mode: 1 },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: isSmall ? 65 : 32,
        minBarSpacing: 14,
        rightOffset: 8,
      },
      rightPriceScale: { borderColor: '#334155', autoScale: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartApiRef.current = chart;
    seriesRef.current = candleSeries;

    try {
      const scenario = buildScenarioForPattern(selectedPattern, direction);
      fullCandlesRef.current = scenario.candles;

      const hiddenCandles = scenario.candles.slice(0, scenario.triggerIndex + 1);
      candleSeries.setData(hiddenCandles as any);

      const markers: any[] = [];

      if (pid === 'ss29' || pid === 'ss30') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: direction === 'CALL' ? '#10b981' : '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? '1: VERDE' : '1: ROJO',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: direction === 'CALL' ? '#ef4444' : '#10b981',
            shape: 'circle',
            text: direction === 'CALL' ? '2: ROJO' : '2: VERDE',
          });
        }
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: direction === 'CALL' ? '#10b981' : '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? '3: VERDE' : '3: ROJO',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'CALL' ? '4: ROJO (TRIGGER CALL)' : '4: VERDE (TRIGGER PUT)',
          });
        }
      } else if (pid === 'ss28') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? '1 ROJO' : '1 VERDE',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'CALL' ? '1 VERDE' : '1 ROJO',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'CALL' ? '2 ROJOS (TRIGGER CALL)' : '2 VERDES (TRIGGER PUT)',
          });
        }
      } else if (pid === 'ss27') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'PUT' ? '1 VERDE' : '1 ROJO',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'PUT' ? '1 ROJO' : '1 VERDE',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'PUT' ? '2 VERDES (TRIGGER PUT)' : '2 ROJOS (TRIGGER CALL)',
          });
        }
      } else if (pid === 'ss26') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'PUT' ? '1 ROJO' : '1 VERDE',
          });
        }
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'PUT' ? '2 VERDES' : '2 ROJOS',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'PUT' ? '1 ROJO' : '1 VERDE',
          });
        }
        if (hiddenCandles[4]) {
          markers.push({
            time: hiddenCandles[4].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'PUT' ? '1 VERDE (TRIGGER PUT)' : '1 ROJO (TRIGGER CALL)',
          });
        }
      } else if (pid === 'ss25') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'CALL' ? '1 VERDE' : '1 ROJO',
          });
        }
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? '2 ROJOS' : '2 VERDES',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'CALL' ? '1 VERDE' : '1 ROJO',
          });
        }
        if (hiddenCandles[4]) {
          markers.push({
            time: hiddenCandles[4].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'CALL' ? '1 ROJO (TRIGGER CALL)' : '1 VERDE (TRIGGER PUT)',
          });
        }
      } else if (pid === 'ss24') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#94a3b8',
            shape: 'circle',
            text: '1',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#94a3b8',
            shape: 'circle',
            text: '2',
          });
        }
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#94a3b8',
            shape: 'circle',
            text: '3 (CRECIENTE)',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: '4: VELA CLÍMAX (TRIGGER)',
          });
        }
      } else if (pid === 'ss23') {
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'PUT' ? '3 VELAS ROJAS IMPULSO' : '3 VELAS VERDES IMPULSO',
          });
        }
        if (hiddenCandles[4]) {
          markers.push({
            time: hiddenCandles[4].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'PUT' ? '3 VELAS VERDES RETROCESO' : '3 VELAS ROJAS RETROCESO',
          });
        }
        if (hiddenCandles[6]) {
          markers.push({
            time: hiddenCandles[6].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'VELA RUPTURA (ENGULLE 3 VERDES)',
          });
        }
      } else if (pid === 'ss22') {
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'CALL' ? '3 VELAS VERDES IMPULSO' : '3 VELAS ROJAS IMPULSO',
          });
        }
        if (hiddenCandles[4]) {
          markers.push({
            time: hiddenCandles[4].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? '3 VELAS ROJAS RETROCESO' : '3 VELAS VERDES RETROCESO',
          });
        }
        if (hiddenCandles[6]) {
          markers.push({
            time: hiddenCandles[6].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'VELA RUPTURA (ENGULLE 3 VELAS)',
          });
        }
      } else if (pid === 'ss21') {
        if (hiddenCandles[4]) {
          markers.push({
            time: hiddenCandles[4].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: 'MÍNIMO 5 VELAS',
          });
        }
        if (hiddenCandles[5]) {
          markers.push({
            time: hiddenCandles[5].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#a855f7',
            shape: 'circle',
            text: 'VELA COLOR OPUESTO (CANAL)',
          });
        }
        if (hiddenCandles[8]) {
          markers.push({
            time: hiddenCandles[8].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'VELA DE RUPTURA (TRIGGER)',
          });
        }
      } else if (pid === 'ss20') {
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#38bdf8',
            shape: 'circle',
            text: 'VELA DOJI',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'VELA DEL MISMO COLOR (TRIGGER)',
          });
        }
      } else if (pid === 'ss19') {
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#38bdf8',
            shape: 'circle',
            text: 'VELA DOJI (SNR)',
          });
        }
        if (hiddenCandles[5]) {
          markers.push({
            time: hiddenCandles[5].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'VELA DE RUPTURA (TRIGGER)',
          });
        }
      } else if (pid === 'ss18') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'PUT' ? 'VERDE SIN COLA' : 'ROJA SIN MECHA SUP.',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'PUT' ? 'aboveBar' : 'belowBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'PUT' ? 'ROJA SIN COLA (TRIGGER)' : 'VERDE SIN COLA (TRIGGER)',
          });
        }
      } else if (pid === 'ss17') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? 'ROJA SIN CABEZA' : 'VERDE SIN MECHA SUP.',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'CALL' ? 'VERDE SIN COLA (TRIGGER)' : 'ROJA SIN MECHA SUP. (TRIGGER)',
          });
        }
      } else if (pid === 'ss16') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: 'MARTILLO INVERTIDO',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: 'belowBar',
            color: '#38bdf8',
            shape: 'circle',
            text: 'MARTILLO (TRIGGER CALL)',
          });
        }
      } else if (pid === 'ss15') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: 'belowBar',
            color: '#10b981',
            shape: 'circle',
            text: direction === 'PUT' ? 'MARTILLO' : 'MARTILLO INVERTIDO',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: 'aboveBar',
            color: '#ef4444',
            shape: 'circle',
            text: direction === 'PUT' ? 'MARTILLO INVERTIDO (TRIGGER)' : 'MARTILLO (TRIGGER)',
          });
        }
      } else if (pid === 'ss14') {
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#38bdf8',
            shape: 'circle',
            text: direction === 'PUT' ? 'MÍNIMO ROJA' : 'MÁXIMO VERDE',
          });
        }
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'PUT' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'PUT' ? 'MECHA VERDE ROMPE MÍNIMO' : 'MECHA ROJA ROMPE MÁXIMO',
          });
        }
      } else if (pid === 'ss13') {
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: direction === 'CALL' ? 'MÍNIMO 3 ROJAS' : 'MÍNIMO 3 VERDES',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: direction === 'CALL' ? '#10b981' : '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? 'DOJI VERDE (TRIGGER)' : 'DOJI ROJO (TRIGGER)',
          });
        }
      } else if (pid === 'ss12') {
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: 'belowBar',
            color: '#3b82f6',
            shape: 'circle',
            text: 'VERDE + ROJA',
          });
        }
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: direction === 'CALL' ? '#10b981' : '#ef4444',
            shape: 'circle',
            text: direction === 'CALL' ? 'DOJI VERDE (TRIGGER CALL)' : 'DOJI ROJO (TRIGGER PUT)',
          });
        }
      } else if (pid === 'ss11') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: direction === 'CALL' ? 'VELA VERDE PREVIA' : 'VELA ROJA PREVIA',
          });
        }
      } else if (pid === 'ss10') {
        if (hiddenCandles[0]) {
          markers.push({
            time: hiddenCandles[0].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: 'VELA PREVIA AL GAP',
          });
        }
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'CALL' ? 'GAP UP (1ª OP: CALL)' : 'GAP DOWN (1ª OP: PUT)',
          });
        }
      } else if (pid === 'ss09') {
        if (hiddenCandles[8]) {
          markers.push({
            time: hiddenCandles[8].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: 'SS8 TRADE GANADO',
          });
        }
        if (hiddenCandles[9]) {
          markers.push({
            time: hiddenCandles[9].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'SEGUIDA DEL MISMO COLOR (TRIGGER SS9)',
          });
        }
      } else if (pid === 'ss08') {
        if (hiddenCandles[7]) {
          markers.push({
            time: hiddenCandles[7].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'ESTA VELA HA ROTO EL PATRÓN',
          });
        }
      } else if (pid === 'ss07') {
        if (hiddenCandles[1]) {
          markers.push({
            time: hiddenCandles[1].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: direction === 'CALL' ? 'VERDE-ROJO-VERDE' : 'ROJO-VERDE-ROJO',
          });
        }
        if (hiddenCandles[4]) {
          markers.push({
            time: hiddenCandles[4].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#10b981',
            shape: 'circle',
            text: 'MÍNIMO 3-4 VELAS IMPULSO',
          });
        }
        if (hiddenCandles[6]) {
          markers.push({
            time: hiddenCandles[6].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: '1 VELA OPUESTA (TRIGGER)',
          });
        }
      } else if (pid === 'ss06') {
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: 'MÍNIMO 4 VELAS',
          });
        }
        if (hiddenCandles[5]) {
          markers.push({
            time: hiddenCandles[5].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'RUPTURA CON CUERPO (VÁLIDA)',
          });
        }
      } else if (pid === 'ss05') {
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: 'MÍNIMO 4 VELAS',
          });
        }
        if (hiddenCandles[6]) {
          markers.push({
            time: hiddenCandles[6].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'TRIGGER: NO ROMPE SNR',
          });
        }
      } else if (pid === 'ss04') {
        if (hiddenCandles[2]) {
          markers.push({
            time: hiddenCandles[2].time,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6',
            shape: 'circle',
            text: direction === 'CALL' ? 'ENGULLIMIENTO ALCISTA' : 'ENGULLIMIENTO BAJISTA',
          });
        }
        if (hiddenCandles[3]) {
          markers.push({
            time: hiddenCandles[3].time,
            position: direction === 'CALL' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b',
            shape: 'circle',
            text: direction === 'CALL' ? 'VELA VERDE SIN COLA' : 'VELA ROJA SIN COLA',
          });
        }
      } else {
        const triggerCandle = hiddenCandles[scenario.triggerIndex];
        if (triggerCandle) {
          markers.push({
            time: triggerCandle.time as any,
            position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
            color: '#f59e0b',
            shape: 'circle',
            text: 'TRIGGER (CONFIRMACIÓN)',
          });
        }
      }

      candleSeries.setMarkers(markers);

      if (scenario.snrLevel && !['ss08', 'ss09', 'ss10', 'ss11', 'ss12', 'ss15', 'ss16', 'ss24', 'ss25', 'ss26', 'ss27', 'ss28', 'ss29', 'ss30'].includes(pid)) {
        candleSeries.createPriceLine({
          price: scenario.snrLevel,
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: pid === 'ss23' ? 'SUELO PREVIO' : pid === 'ss22' ? 'TECHO PREVIO' : pid === 'ss21' ? 'LÍNEA RUPTURA' : 'LÍNEA SNR',
        });
      }

      if (pid === 'ss21') {
        const secondaryLevel = direction === 'CALL' ? 94.0 : 106.0;
        candleSeries.createPriceLine({
          price: secondaryLevel,
          color: '#64748b',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'BASE CANAL',
        });
      }

      chart.timeScale().scrollToRealtime();
      setTimeout(renderRangeBox, 40);
    } catch (e) {
      console.error(e);
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(renderRangeBox);

    const handleResize = () => {
      if (el && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: el.clientWidth,
          height: el.clientHeight,
        });
        renderRangeBox();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timerRef.current) clearInterval(timerRef.current);
      if (chartApiRef.current) {
        try { chartApiRef.current.remove(); } catch (e) {}
        chartApiRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [selectedPattern?.id, direction]);

  useEffect(() => {
    const handleTradeExecuted = (event: any) => {
      const s = seriesRef.current;
      if (!s || fullCandlesRef.current.length === 0) return;

      const { choice } = event.detail;
      const scenario = buildScenarioForPattern(selectedPattern, direction);
      const fullCandles = fullCandlesRef.current;
      s.setData(fullCandles as any);

      const triggerCandle = fullCandles[scenario.triggerIndex];
      const tradeCandle = fullCandles[scenario.resolutionIndex] || fullCandles[fullCandles.length - 1];

      s.setMarkers([
        {
          time: triggerCandle.time as any,
          position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
          color: '#f59e0b',
          shape: 'circle',
          text: 'PATRÓN DE COLOR CONFIRMADO',
        },
        {
          time: tradeCandle.time as any,
          position: scenario.expectedAction === 'CALL' ? 'belowBar' : 'aboveBar',
          color: '#3b82f6',
          shape: scenario.expectedAction === 'CALL' ? 'arrowUp' : 'arrowDown',
          text: `ENTRADA: ${choice}`,
        },
        {
          time: tradeCandle.time as any,
          position: scenario.expectedAction === 'CALL' ? 'aboveBar' : 'belowBar',
          color: choice === scenario.expectedAction ? '#10b981' : '#ef4444',
          shape: 'square',
          text: choice === scenario.expectedAction ? 'ITM (GANADA)' : 'OTM (PERDIDA)',
        },
      ]);

      renderRangeBox();

      let activeCandle: CandlestickBar = { ...tradeCandle };
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        if (!seriesRef.current) return;
        const tick = (Math.random() - 0.48) * 0.20;
        const nextClose = Number((activeCandle.close + tick).toFixed(2));
        const nextHigh = Number(Math.max(activeCandle.high, nextClose).toFixed(2));
        const nextLow = Number(Math.min(activeCandle.low, nextClose).toFixed(2));

        activeCandle = {
          ...activeCandle,
          close: nextClose,
          high: nextHigh,
          low: nextLow,
        };

        try { seriesRef.current.update(activeCandle as any); } catch (e) {}
      }, 350);
    };

    window.addEventListener('trade-executed', handleTradeExecuted);
    return () => {
      window.removeEventListener('trade-executed', handleTradeExecuted);
    };
  }, [direction, selectedPattern]);

  const pid = (selectedPattern?.id || selectedPattern?.code || '').toLowerCase();
  const isSS29 = pid === 'ss29' || pid === 'ss30';

  return (
    <div className="flex flex-col h-full w-full bg-[#080c14]">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-800 bg-[#0d131f] shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
            {selectedPattern?.code || 'SS01'}
          </span>
          <h2 className="text-sm font-semibold text-white">
            {selectedPattern?.name || 'Patrón'}
          </h2>

          <div className="flex items-center bg-gray-900 border border-gray-700 rounded p-0.5 ml-3">
            <button
              onClick={() => handleSelectDirection('CALL')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                direction === 'CALL'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isSS29 ? '▲ Configuración Compra (CALL)' : '▲ Escenario Alcista (CALL)'}
            </button>
            <button
              onClick={() => handleSelectDirection('PUT')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                direction === 'PUT'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isSS29 ? '▼ Configuración Venta (PUT)' : '▼ Escenario Bajista (PUT)'}
            </button>
          </div>
        </div>

        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
          MTG: {selectedPattern?.mtgPolicy || '1_STEP'}
        </span>
      </div>

      <div className="relative flex-1 w-full h-full min-h-[360px] bg-[#080c14]">
        <div 
          ref={chartContainerRef} 
          className="absolute inset-0 w-full h-full" 
        />
        <canvas
          ref={canvasOverlayRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />
      </div>
    </div>
  );
};
