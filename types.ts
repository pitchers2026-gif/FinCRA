
export type NodeType = 'CONDITION' | 'OPERATOR' | 'ACTION';

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  x: number;
  y: number;
  icon: string;
  status?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'solid' | 'dashed';
}

export interface DataField {
  name: string;
  type: string;
  source: string;
  description: string;
}

export interface SimulationStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed';
}

// CRA Engine Types (shared with backend API)
export interface CRAInput {
  record_id?: string;
  entity_name?: string;
  country_code?: string;
  domicile?: string;
  industry_code?: string | number;
  industry_description?: string;
  sic_codes?: number[];
  entity_type?: string;
  product_data?: { type?: string };
  product_type?: string;
  delivery_data?: { channels?: string[] };
  sanction_match?: boolean;
  sanction_likelihood?: number;
  pep_count?: number;
  has_pep?: boolean;
  has_adverse_media?: boolean;
  geography_prohibited?: boolean;
  bearer_shares?: boolean;
  /** Shell company: no employees */
  has_employees?: boolean;
  /** Shell company: no physical premises */
  has_premises?: boolean;
  /** Shell company: no CAIS (Credit Account Information Service) */
  has_cais?: boolean;
  /** Shell company: no PP (e.g. payment profile / presence) */
  has_pp?: boolean;
  [key: string]: unknown;
}

export interface CRAOutput {
  record_id: string;
  entity_name: string;
  final_score: number;
  risk_band: string;
  pre_override_score: number;
  override_applied?: string;
  findings: string[];
}

export interface CRAWeights {
  geo: number;
  ind: number;
  ent: number;
  prod: number;
  deliv: number;
}

export type OverrideConditionType =
  | 'geography_prohibited'
  | 'sanctions'
  | 'pep_am'
  | 'shell_company'
  | 'industry_cbd'
  | 'industry_crypto'
  | 'bearer_shares'
  | 'adult_entertainment';

export interface OverrideRule {
  id: string;
  name: string;
  conditionType: OverrideConditionType;
  resultScore: number;
  priority: number;
  config?: Record<string, unknown>;
}

export interface RiskBand {
  name: string;
  min: number;
  max: number;
}

export interface ComponentDefaults {
  geo: number;
  ind: number;
  ent: number;
  prod: number;
  deliv: number;
}

export interface CRAEngineConfig {
  weights: CRAWeights;
  componentDefaults: ComponentDefaults;
  overrideRules: OverrideRule[];
  riskBands: RiskBand[];
  prohibitedCountries: string[];
}

export const DEFAULT_CRA_ENGINE_CONFIG: CRAEngineConfig = {
  weights: { geo: 0.3, ind: 0.15, ent: 0.2, prod: 0.3, deliv: 0.05 },
  componentDefaults: { geo: 3, ind: 3, ent: 3, prod: 3, deliv: 3 },
  overrideRules: [
    { id: '1', name: 'Geography Prohibited', conditionType: 'geography_prohibited', resultScore: 5, priority: 1 },
    { id: '2', name: 'Sanctions Match', conditionType: 'sanctions', resultScore: 5, priority: 2 },
    { id: '3', name: 'PEP/AM Match', conditionType: 'pep_am', resultScore: 5, priority: 3 },
    { id: '4', name: 'Shell Company', conditionType: 'shell_company', resultScore: 5, priority: 4 },
  ],
  riskBands: [
    { name: 'Very Low Risk', min: 0, max: 1 },
    { name: 'Low Risk', min: 1, max: 2 },
    { name: 'Medium Risk', min: 2, max: 3 },
    { name: 'High Risk', min: 3, max: 4 },
    { name: 'Very High Risk', min: 4, max: 5 },
  ],
  prohibitedCountries: [],
};

export const CRA_ENGINE_CONFIG_KEY = 'cra_engine_config';
