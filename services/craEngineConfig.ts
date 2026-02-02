import {
  CRAEngineConfig,
  DEFAULT_CRA_ENGINE_CONFIG,
  CRA_ENGINE_CONFIG_KEY,
} from '../types';

export function loadCRAEngineConfig(): CRAEngineConfig {
  try {
    const raw = localStorage.getItem(CRA_ENGINE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeWithDefaults(parsed);
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_CRA_ENGINE_CONFIG;
}

export function saveCRAEngineConfig(config: CRAEngineConfig): void {
  localStorage.setItem(CRA_ENGINE_CONFIG_KEY, JSON.stringify(config));
}

function mergeWithDefaults(parsed: Partial<CRAEngineConfig>): CRAEngineConfig {
  return {
    weights: { ...DEFAULT_CRA_ENGINE_CONFIG.weights, ...parsed.weights },
    componentDefaults: { ...DEFAULT_CRA_ENGINE_CONFIG.componentDefaults, ...parsed.componentDefaults },
    overrideRules: parsed.overrideRules ?? DEFAULT_CRA_ENGINE_CONFIG.overrideRules,
    riskBands: parsed.riskBands?.length ? parsed.riskBands : DEFAULT_CRA_ENGINE_CONFIG.riskBands,
    prohibitedCountries: Array.isArray(parsed.prohibitedCountries) ? parsed.prohibitedCountries : [],
  };
}
