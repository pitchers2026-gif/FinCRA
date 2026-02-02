import {
  CRAEngineConfig,
  CRAInput,
  CRAOutput,
  RiskBand,
  OverrideRule,
} from '../types';

export type { CRAInput, CRAOutput };

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getComponentScore(
  input: CRAInput,
  pillar: keyof CRAInput,
  defaultScore: number,
  _scorecard?: Record<string, number>
): number {
  const val = input[pillar];
  if (val === undefined || val === null) return defaultScore;
  // Simplified: use default or derive from input. Full implementation would use scorecards.
  if (typeof val === 'number' && val >= 1 && val <= 5) return val;
  return defaultScore;
}

function getRiskBand(finalScore: number, riskBands: RiskBand[]): string {
  const sorted = [...riskBands].sort((a, b) => a.min - b.min);
  for (const band of sorted) {
    if (finalScore >= band.min && finalScore <= band.max) return band.name;
  }
  return sorted[sorted.length - 1]?.name ?? 'Unknown';
}

function checkOverride(
  input: CRAInput,
  rule: OverrideRule,
  prohibitedCountries: string[]
): boolean {
  const cc = (input.country_code || input.domicile || '').toUpperCase();
  switch (rule.conditionType) {
    case 'geography_prohibited':
      return input.geography_prohibited === true || prohibitedCountries.includes(cc);
    case 'sanctions':
      return input.sanction_match === true || (input.sanction_likelihood ?? 0) >= 99;
    case 'pep_am':
      return (input.pep_count ?? 0) > 0 || input.has_pep === true || input.has_adverse_media === true;
    case 'shell_company':
      // Simplified: no explicit shell logic in input
      return false;
    case 'industry_cbd':
      return false;
    case 'industry_crypto':
      const desc = (input.industry_description || '').toLowerCase();
      return desc.includes('crypto') || desc.includes('cryptocurrency');
    case 'bearer_shares':
      return input.bearer_shares === true;
    case 'adult_entertainment':
      return false;
    default:
      return false;
  }
}

function isGeographyProhibited(input: CRAInput, prohibitedCountries: string[]): boolean {
  const cc = (input.country_code || input.domicile || '').toString().trim().toUpperCase();
  return input.geography_prohibited === true || (cc !== '' && prohibitedCountries.includes(cc));
}

export function calculateCRA(input: CRAInput, config: CRAEngineConfig): CRAOutput {
  const findings: string[] = [];
  const { weights, componentDefaults, overrideRules, riskBands, prohibitedCountries } = config;

  const geo = getComponentScore(input, 'country_code', componentDefaults.geo);
  const ind = getComponentScore(input, 'industry_code', componentDefaults.ind);
  const ent = getComponentScore(input, 'entity_type', componentDefaults.ent);
  const prod = getComponentScore(input, 'product_type', componentDefaults.prod);
  const deliv = getComponentScore(input, 'delivery_data', componentDefaults.deliv);

  const sumWeights = weights.geo + weights.ind + weights.ent + weights.prod + weights.deliv;
  const n =
    sumWeights > 0
      ? {
          geo: weights.geo / sumWeights,
          ind: weights.ind / sumWeights,
          ent: weights.ent / sumWeights,
          prod: weights.prod / sumWeights,
          deliv: weights.deliv / sumWeights,
        }
      : { geo: 0.2, ind: 0.2, ent: 0.2, prod: 0.2, deliv: 0.2 };

  const preOverride = clamp(
    Math.round(n.geo * geo + n.ind * ind + n.ent * ent + n.prod * prod + n.deliv * deliv),
    1,
    5
  );

  let finalScore = preOverride;
  let overrideApplied: string | undefined;

  if (isGeographyProhibited(input, prohibitedCountries)) {
    finalScore = 5;
    overrideApplied = 'Geography - Prohibited';
    findings.push('Override: Geography - Prohibited → score 5');
  } else {
    const sortedOverrides = [...overrideRules].sort((a, b) => a.priority - b.priority);
    for (const rule of sortedOverrides) {
      if (checkOverride(input, rule, prohibitedCountries)) {
        finalScore = clamp(rule.resultScore, 1, 5);
        overrideApplied = rule.name;
        findings.push(`Override: ${rule.name} → score ${rule.resultScore}`);
        break;
      }
    }
  }

  if (input.sanction_match) findings.push('Direct Sanctions List match');
  if ((input.pep_count ?? 0) > 0) findings.push(`${input.pep_count} PEP associations found`);
  const cc = (input.country_code || input.domicile || '').toUpperCase();
  if (prohibitedCountries.includes(cc)) findings.push('Geography - Prohibited country');
  if (cc && cc !== 'GB') findings.push('Non-UK jurisdiction');

  const riskBand = getRiskBand(finalScore, riskBands);

  return {
    record_id: input.record_id ?? 'unknown',
    entity_name: input.entity_name ?? 'Unknown Entity',
    final_score: finalScore,
    risk_band: riskBand,
    pre_override_score: preOverride,
    override_applied: overrideApplied,
    findings,
  };
}
