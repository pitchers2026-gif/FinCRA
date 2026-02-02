import type {
  CRAEngineConfig,
  CRAInput,
  CRAOutput,
  RiskBand,
  OverrideRule,
} from '../types';
import { getScorecards } from './loadScorecards';

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const ADULT_ENTERTAINMENT_SIC = new Set([
  1312, 1370, 1373, 64705, 9001, 9002, 9003, 9004,
]);
const CBD_CANNABIS_SIC = new Set([
  1190, 1200, 1210, 1220, 1230, 1240, 1250, 1260, 1270, 1280, 1290,
]);
const CBD_KEYWORDS = /cannabis|cbd|cannabidiol|marijuana|hemp/i;

function getComponentScore(
  input: CRAInput,
  pillar: 'geo' | 'ind' | 'ent' | 'prod' | 'deliv',
  defaultScore: number,
  scorecards: ReturnType<typeof getScorecards>
): number {
  switch (pillar) {
    case 'geo': {
      const cc = (input.country_code || input.domicile || '')
        .toString()
        .trim()
        .toUpperCase();
      if (!cc) return defaultScore;
      const score = scorecards.geography[cc] ?? scorecards.geography['default'];
      return score != null ? clamp(score, 1, 5) : defaultScore;
    }
    case 'ind': {
      const scorecard = scorecards.industry;
      const code = input.industry_code;
      if (code != null) {
        const s = scorecard[String(code)];
        if (s != null) return clamp(s, 1, 5);
      }
      const sics = input.sic_codes;
      if (Array.isArray(sics) && sics.length > 0) {
        const s = scorecard[String(sics[0])];
        if (s != null) return clamp(s, 1, 5);
      }
      return scorecard['default'] != null
        ? clamp(scorecard['default'], 1, 5)
        : defaultScore;
    }
    case 'ent': {
      const et = (input.entity_type || '')
        .toString()
        .trim();
      if (!et) return defaultScore;
      const score = scorecards.entity[et] ?? scorecards.entity['default'];
      return score != null ? clamp(score, 1, 5) : defaultScore;
    }
    case 'prod': {
      const pt = (input.product_type || input.product_data?.type || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
      if (!pt) return defaultScore;
      const score = scorecards.product[pt] ?? scorecards.product['default'];
      return score != null ? clamp(score, 1, 5) : defaultScore;
    }
    case 'deliv': {
      const ch = input.delivery_data?.channels;
      if (!Array.isArray(ch) || ch.length === 0) return defaultScore;
      const card = scorecards.delivery;
      let maxScore = defaultScore;
      for (const c of ch) {
        const key = String(c).toLowerCase().replace(/\s+/g, '_');
        const s = card[key] ?? card['default'];
        if (s != null) maxScore = Math.max(maxScore, clamp(s, 1, 5));
      }
      return maxScore;
    }
    default:
      return defaultScore;
  }
}

function getRiskBand(finalScore: number, riskBands: RiskBand[]): string {
  const sorted = [...riskBands].sort((a, b) => a.min - b.min);
  for (const band of sorted) {
    if (finalScore >= band.min && finalScore <= band.max) return band.name;
  }
  return sorted[sorted.length - 1]?.name ?? 'Unknown';
}

function isGeographyProhibited(
  input: CRAInput,
  prohibitedCountries: string[]
): boolean {
  const cc = (input.country_code || input.domicile || '')
    .toString()
    .trim()
    .toUpperCase();
  return (
    input.geography_prohibited === true ||
    (cc !== '' && prohibitedCountries.includes(cc))
  );
}

function checkOverride(
  input: CRAInput,
  rule: OverrideRule,
  prohibitedCountries: string[]
): boolean {
  const cc = (input.country_code || input.domicile || '')
    .toString()
    .trim()
    .toUpperCase();
  switch (rule.conditionType) {
    case 'geography_prohibited':
      return (
        input.geography_prohibited === true ||
        (cc !== '' && prohibitedCountries.includes(cc))
      );
    case 'sanctions':
      return (
        input.sanction_match === true ||
        (input.sanction_likelihood ?? 0) >= 99
      );
    case 'pep_am':
      return (
        (input.pep_count ?? 0) > 0 ||
        input.has_pep === true ||
        input.has_adverse_media === true
      );
    case 'shell_company': {
      const noEmployees = input.has_employees === false;
      const noPremises = input.has_premises === false;
      const noCais = input.has_cais === false;
      const noPp = input.has_pp === false;
      return (
        noEmployees &&
        noPremises &&
        noCais &&
        noPp
      );
    }
    case 'industry_cbd': {
      const sics = input.sic_codes;
      if (Array.isArray(sics)) {
        for (const s of sics) {
          if (CBD_CANNABIS_SIC.has(Number(s))) return true;
        }
      }
      const desc = (input.industry_description || '').toString();
      return CBD_KEYWORDS.test(desc);
    }
    case 'industry_crypto': {
      const desc = (input.industry_description || '').toString().toLowerCase();
      return desc.includes('crypto') || desc.includes('cryptocurrency');
    }
    case 'bearer_shares':
      return input.bearer_shares === true;
    case 'adult_entertainment': {
      const sics = input.sic_codes;
      if (!Array.isArray(sics)) return false;
      for (const s of sics) {
        if (ADULT_ENTERTAINMENT_SIC.has(Number(s))) return true;
      }
      return false;
    }
    default:
      return false;
  }
}

export function calculateCRA(
  input: CRAInput,
  config: CRAEngineConfig
): CRAOutput {
  const findings: string[] = [];
  const {
    weights,
    componentDefaults,
    overrideRules,
    riskBands,
    prohibitedCountries,
  } = config;
  const scorecards = getScorecards();

  const geo = getComponentScore(
    input,
    'geo',
    componentDefaults.geo,
    scorecards
  );
  const ind = getComponentScore(
    input,
    'ind',
    componentDefaults.ind,
    scorecards
  );
  const ent = getComponentScore(
    input,
    'ent',
    componentDefaults.ent,
    scorecards
  );
  const prod = getComponentScore(
    input,
    'prod',
    componentDefaults.prod,
    scorecards
  );
  const deliv = getComponentScore(
    input,
    'deliv',
    componentDefaults.deliv,
    scorecards
  );

  const sumWeights =
    weights.geo + weights.ind + weights.ent + weights.prod + weights.deliv;
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
    const sortedOverrides = [...overrideRules].sort(
      (a, b) => a.priority - b.priority
    );
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
  if ((input.pep_count ?? 0) > 0)
    findings.push(`${input.pep_count} PEP associations found`);
  const cc = (input.country_code || input.domicile || '').toString().toUpperCase();
  if (prohibitedCountries.includes(cc))
    findings.push('Geography - Prohibited country');
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
