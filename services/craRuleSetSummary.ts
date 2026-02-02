import type { CRAEngineConfig, OverrideConditionType } from '../types';

export interface RuleSetSummary {
  intro: string;
  weights: string;
  geographyFirst: string;
  overrides: { priority: number; name: string; conditionLabel: string; resultScore: number }[];
  riskBands: string;
  prohibitedCountries: string;
}

const CONDITION_LABELS: Record<OverrideConditionType, string> = {
  geography_prohibited: 'Geography prohibited',
  sanctions: 'Sanctions match',
  pep_am: 'PEP or adverse media',
  shell_company: 'Shell company indicators',
  industry_cbd: 'CBD/cannabis industry',
  industry_crypto: 'Crypto industry',
  bearer_shares: 'Bearer shares',
  adult_entertainment: 'Adult entertainment industry',
};

function conditionToLabel(conditionType: OverrideConditionType): string {
  return CONDITION_LABELS[conditionType] ?? conditionType.replace(/_/g, ' ');
}

export function getRuleSetSummary(config: CRAEngineConfig): RuleSetSummary {
  const { weights, componentDefaults, overrideRules, riskBands, prohibitedCountries } = config;

  const intro =
    'Your risk score (1–5) is computed from five factors (Geography, Industry, Entity, Product, Delivery) using your chosen weights. Overrides are applied in priority order; the first match sets the score. The score is then mapped to a risk band.';

  const wGeo = Math.round(weights.geo * 100);
  const wInd = Math.round(weights.ind * 100);
  const wEnt = Math.round(weights.ent * 100);
  const wProd = Math.round(weights.prod * 100);
  const wDeliv = Math.round(weights.deliv * 100);
  const weightsStr =
    `Geography ${wGeo}%, Industry ${wInd}%, Entity ${wEnt}%, Product ${wProd}%, Delivery ${wDeliv}. Default score per factor when not found: ${componentDefaults.geo}.`;

  const geographyFirst =
    'We first check if the entity is in a prohibited country; if yes, score = 5 and we stop. Otherwise we apply the override rules below in order (first match wins).';

  const sortedOverrides = [...overrideRules].sort((a, b) => a.priority - b.priority);
  const overrides = sortedOverrides.map((r) => ({
    priority: r.priority,
    name: r.name,
    conditionLabel: conditionToLabel(r.conditionType),
    resultScore: r.resultScore,
  }));

  const riskBandsStr =
    riskBands.length === 0
      ? 'No risk bands configured.'
      : [...riskBands]
          .sort((a, b) => a.min - b.min)
          .map((b) => `${b.name} (${b.min}–${b.max})`)
          .join(', ');

  const prohibitedStr =
    prohibitedCountries.length === 0
      ? 'None'
      : prohibitedCountries.join(', ');

  return {
    intro,
    weights: weightsStr,
    geographyFirst,
    overrides,
    riskBands: riskBandsStr,
    prohibitedCountries: prohibitedStr,
  };
}

/** Canvas node shape for concise summary (type + title only). */
export interface CanvasNodeForSummary {
  type: string;
  title: string;
}

/** Concise summary for the canvas Rule set summary tile (short lines, updates with canvas + CRA config). */
export interface RuleSetSummaryConcise {
  canvas: string;
  weights: string;
  overrides: string;
  prohibited: string;
}

export function getRuleSetSummaryConcise(
  config: CRAEngineConfig,
  nodes: CanvasNodeForSummary[]
): RuleSetSummaryConcise {
  const { weights, overrideRules, riskBands, prohibitedCountries } = config;

  const condCount = nodes.filter((n) => n.type === 'CONDITION').length;
  const opCount = nodes.filter((n) => n.type === 'OPERATOR').length;
  const actionCount = nodes.filter((n) => n.type === 'ACTION').length;
  const canvasStr =
    nodes.length === 0
      ? 'No flow'
      : `${condCount} cond · ${opCount} op · ${actionCount} action`;

  const wGeo = Math.round(weights.geo * 100);
  const wInd = Math.round(weights.ind * 100);
  const wEnt = Math.round(weights.ent * 100);
  const wProd = Math.round(weights.prod * 100);
  const wDeliv = Math.round(weights.deliv * 100);
  const weightsStr = `Geo ${wGeo}% Ind ${wInd}% Ent ${wEnt}% Prod ${wProd}% Del ${wDeliv}%`;

  const overridesStr =
    overrideRules.length === 0
      ? 'No overrides'
      : `${overrideRules.length} override${overrideRules.length !== 1 ? 's' : ''}`;

  const prohibitedStr =
    prohibitedCountries.length === 0 ? 'None' : prohibitedCountries.join(', ');

  return {
    canvas: canvasStr,
    weights: weightsStr,
    overrides: overridesStr,
    prohibited: prohibitedStr,
  };
}
