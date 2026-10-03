import { CandlestickBar, SimulationScenario, ScenarioBuilder } from './types';
import { buildSS01Scenario } from './scenarios/ss01.scenario';
import { buildSS02Scenario } from './scenarios/ss02.scenario';
import { buildSS03Scenario } from './scenarios/ss03.scenario';
import { buildSS04Scenario } from './scenarios/ss04.scenario';
import { buildSS05Scenario } from './scenarios/ss05.scenario';
import { buildSS06Scenario } from './scenarios/ss06.scenario';
import { buildSS07Scenario } from './scenarios/ss07.scenario';
import { buildSS08Scenario } from './scenarios/ss08.scenario';
import { buildSS09Scenario } from './scenarios/ss09.scenario';
import { buildSS10Scenario } from './scenarios/ss10.scenario';
import { buildSS11Scenario } from './scenarios/ss11.scenario';
import { buildSS12Scenario } from './scenarios/ss12.scenario';
import { buildSS13Scenario } from './scenarios/ss13.scenario';
import { buildSS14Scenario } from './scenarios/ss14.scenario';
import { buildSS15Scenario } from './scenarios/ss15.scenario';
import { buildSS16Scenario } from './scenarios/ss16.scenario';
import { buildSS17Scenario } from './scenarios/ss17.scenario';
import { buildSS18Scenario } from './scenarios/ss18.scenario';
import { buildSS19Scenario } from './scenarios/ss19.scenario';
import { buildSS20Scenario } from './scenarios/ss20.scenario';
import { buildSS21Scenario } from './scenarios/ss21.scenario';
import { buildSS22Scenario } from './scenarios/ss22.scenario';
import { buildSS23Scenario } from './scenarios/ss23.scenario';
import { buildSS24Scenario } from './scenarios/ss24.scenario';
import { buildSS25Scenario } from './scenarios/ss25.scenario';
import { buildSS26Scenario } from './scenarios/ss26.scenario';
import { buildSS27Scenario } from './scenarios/ss27.scenario';
import { buildSS28Scenario } from './scenarios/ss28.scenario';
import { buildSS29Scenario } from './scenarios/ss29.scenario';

export * from './types';

const registry: Record<string, ScenarioBuilder> = {
  ss01: buildSS01Scenario,
  ss02: buildSS02Scenario,
  ss03: buildSS03Scenario,
  ss04: buildSS04Scenario,
  ss05: buildSS05Scenario,
  ss06: buildSS06Scenario,
  ss07: buildSS07Scenario,
  ss08: buildSS08Scenario,
  ss09: buildSS09Scenario,
  ss10: buildSS10Scenario,
  ss11: buildSS11Scenario,
  ss12: buildSS12Scenario,
  ss13: buildSS13Scenario,
  ss14: buildSS14Scenario,
  ss15: buildSS15Scenario,
  ss16: buildSS16Scenario,
  ss17: buildSS17Scenario,
  ss18: buildSS18Scenario,
  ss19: buildSS19Scenario,
  ss20: buildSS20Scenario,
  ss21: buildSS21Scenario,
  ss22: buildSS22Scenario,
  ss23: buildSS23Scenario,
  ss24: buildSS24Scenario,
  ss25: buildSS25Scenario,
  ss26: buildSS26Scenario,
  ss27: buildSS27Scenario,
  ss28: buildSS28Scenario,
  ss29: buildSS29Scenario,
  ss30: buildSS29Scenario,
};

function buildFallbackScenario(direction: 'CALL' | 'PUT'): SimulationScenario {
  const baseTimestamp = 1700000000;
  const step = 60;
  const candles: CandlestickBar[] = [];
  const isBull = direction === 'CALL';
  let cur = 100.0;

  for (let i = 0; i < 7; i++) {
    const open = cur;
    const delta = isBull ? (i >= 4 ? 2.0 : -1.5) : (i >= 4 ? -2.0 : 1.5);
    const close = Number((open + delta).toFixed(2));
    const high = Number((Math.max(open, close) + 0.6).toFixed(2));
    const low = Number((Math.min(open, close) - 0.6).toFixed(2));
    cur = close;

    candles.push({
      time: baseTimestamp + (i * step),
      open,
      high,
      low,
      close,
    });
  }

  return {
    candles,
    triggerIndex: 5,
    resolutionIndex: 6,
    snrLevel: candles[1].open,
    expectedAction: isBull ? 'CALL' : 'PUT',
  };
}

export function buildScenarioForPattern(pattern: any, direction: 'CALL' | 'PUT' = 'CALL'): SimulationScenario {
  const id = (pattern?.id || pattern?.code || 'ss01').toLowerCase();
  const builder = registry[id];

  if (builder) {
    return builder(direction);
  }

  return buildFallbackScenario(direction);
}
