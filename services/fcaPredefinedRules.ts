import { CRAWeights, Connection } from '../types';
import { DEFAULT_CRA_ENGINE_CONFIG } from '../types';

export interface PredefinedNode {
  id: string;
  type: 'CONDITION' | 'OPERATOR' | 'ACTION';
  title: string;
  desc: string;
  x: number;
  y: number;
  icon: string;
}

export interface PredefinedRule {
  id: string;
  name: string;
  description: string;
  nodes: PredefinedNode[];
  connections: Connection[];
  weights: CRAWeights;
}

const DEFAULT_WEIGHTS = DEFAULT_CRA_ENGINE_CONFIG.weights;

export const FCA_PREDEFINED_RULES: PredefinedRule[] = [
  {
    id: 'fca-pep-edd',
    name: 'FCA PEP & High-Risk – EDD',
    description: 'FCA PEP and high-risk jurisdiction screening; triggers Enhanced Due Diligence (FCG, FG25/3).',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'PEP List Match', desc: 'FCA PEP database match.', x: 80, y: 80, icon: 'person_search' },
      { id: 'n2', type: 'CONDITION', title: 'Country High Risk', desc: 'Check if country is on UK High-Risk list.', x: 80, y: 200, icon: 'warning' },
      { id: 'n3', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 140, icon: 'alt_route' },
      { id: 'n4', type: 'ACTION', title: 'Manual EDD', desc: 'Enhanced Due Diligence required.', x: 480, y: 160, icon: 'assignment_ind' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n3', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n3', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-sanctions-block',
    name: 'UK Sanctions – Block & Escalate',
    description: 'FCG 7: Sanctions match triggers block and MLRO escalation.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'Sanctions Match', desc: 'Direct sanctions list match identified.', x: 80, y: 140, icon: 'gavel' },
      { id: 'n2', type: 'ACTION', title: 'Block Tx', desc: 'Block transaction.', x: 320, y: 80, icon: 'block' },
      { id: 'n3', type: 'ACTION', title: 'Escalate to MLRO', desc: 'Escalate to Money Laundering Reporting Officer.', x: 320, y: 200, icon: 'campaign' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n2', type: 'dashed' },
      { id: 'c2', from: 'n1', to: 'n3', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-high-risk-jurisdiction',
    name: 'FCA High-Risk Jurisdiction Screening',
    description: 'UK AML high-risk list, prohibited jurisdictions, offshore domicile; flag and request documentation.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'UK High-Risk List', desc: 'Entity domicile matches UK AML high-risk jurisdictions.', x: 60, y: 60, icon: 'list_alt' },
      { id: 'n2', type: 'CONDITION', title: 'Prohibited Jurisdiction', desc: 'Country is on prohibited list.', x: 60, y: 160, icon: 'block' },
      { id: 'n3', type: 'CONDITION', title: 'Offshore Domicile', desc: 'Entity incorporated in offshore jurisdiction.', x: 60, y: 260, icon: 'travel_explore' },
      { id: 'n4', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 160, icon: 'alt_route' },
      { id: 'n5', type: 'ACTION', title: 'Flag Alert', desc: 'Flag for review or alert.', x: 480, y: 100, icon: 'flag' },
      { id: 'n6', type: 'ACTION', title: 'Request Documentation', desc: 'Request additional documentation.', x: 480, y: 220, icon: 'folder_open' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n4', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n4', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'solid' },
      { id: 'c4', from: 'n4', to: 'n5', type: 'dashed' },
      { id: 'c5', from: 'n4', to: 'n6', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-source-of-funds-ubo',
    name: 'FCA Source of Funds & UBO',
    description: 'Source of funds or UBO transparency not verified; request evidence and UBO details.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'Source of Funds', desc: 'Source of funds verification status.', x: 80, y: 80, icon: 'savings' },
      { id: 'n2', type: 'CONDITION', title: 'UBO Transparency', desc: 'Ultimate beneficial owner transparency check.', x: 80, y: 200, icon: 'group' },
      { id: 'n3', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 140, icon: 'alt_route' },
      { id: 'n4', type: 'ACTION', title: 'Request Source of Funds', desc: 'Request source of funds evidence.', x: 480, y: 80, icon: 'request_quote' },
      { id: 'n5', type: 'ACTION', title: 'Request UBO Details', desc: 'Request ultimate beneficial owner details.', x: 480, y: 200, icon: 'contact_page' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n3', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n3', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'dashed' },
      { id: 'c4', from: 'n3', to: 'n5', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-crypto-high-risk-sector',
    name: 'FCA Crypto / High-Risk Sector',
    description: 'Crypto or CBD sector; review required and enhanced monitoring.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'Industry Crypto', desc: 'Crypto or cryptocurrency industry.', x: 80, y: 80, icon: 'currency_bitcoin' },
      { id: 'n2', type: 'CONDITION', title: 'Industry CBD', desc: 'CBD or cannabis-related industry.', x: 80, y: 200, icon: 'grass' },
      { id: 'n3', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 140, icon: 'alt_route' },
      { id: 'n4', type: 'ACTION', title: 'Review Required', desc: 'Manual compliance review required.', x: 480, y: 80, icon: 'rate_review' },
      { id: 'n5', type: 'ACTION', title: 'Apply Enhanced Monitoring', desc: 'Apply enhanced transaction monitoring.', x: 480, y: 200, icon: 'monitoring' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n3', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n3', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'dashed' },
      { id: 'c4', from: 'n3', to: 'n5', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-sar-escalation',
    name: 'FCA SAR Referral – Suspicious Activity',
    description: 'Sanctions or adverse media match; create SAR referral and log for audit.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'Sanctions Match', desc: 'Direct sanctions list match identified.', x: 80, y: 80, icon: 'gavel' },
      { id: 'n2', type: 'CONDITION', title: 'Adverse Media', desc: 'Adverse media or negative news match.', x: 80, y: 200, icon: 'newspaper' },
      { id: 'n3', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 140, icon: 'alt_route' },
      { id: 'n4', type: 'ACTION', title: 'Create SAR Referral', desc: 'Create Suspicious Activity Report referral.', x: 480, y: 80, icon: 'report' },
      { id: 'n5', type: 'ACTION', title: 'Log for Audit', desc: 'Log event for audit trail.', x: 480, y: 200, icon: 'history' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n3', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n3', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'dashed' },
      { id: 'c4', from: 'n3', to: 'n5', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-bearer-shares-shell',
    name: 'FCA Bearer Shares & Shell Indicators',
    description: 'Bearer shares or shell company indicators; escalate to MLRO and request UBO details.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'Bearer Shares', desc: 'Entity has bearer shares (high risk indicator).', x: 80, y: 80, icon: 'receipt_long' },
      { id: 'n2', type: 'CONDITION', title: 'Shell Company Indicators', desc: 'Signs of shell company (no employees, no premises).', x: 80, y: 200, icon: 'account_balance' },
      { id: 'n3', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 140, icon: 'alt_route' },
      { id: 'n4', type: 'ACTION', title: 'Escalate to MLRO', desc: 'Escalate to Money Laundering Reporting Officer.', x: 480, y: 80, icon: 'campaign' },
      { id: 'n5', type: 'ACTION', title: 'Request UBO Details', desc: 'Request ultimate beneficial owner details.', x: 480, y: 200, icon: 'contact_page' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n3', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n3', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'dashed' },
      { id: 'c4', from: 'n3', to: 'n5', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'fca-document-kyb-expiry',
    name: 'FCA Document & KYB Expiry',
    description: 'Document expiry or KYB status incomplete; request documentation and suspend pending review.',
    nodes: [
      { id: 'n1', type: 'CONDITION', title: 'Document Expiry', desc: 'ID or KYB document expiry date check.', x: 80, y: 80, icon: 'event_busy' },
      { id: 'n2', type: 'CONDITION', title: 'KYB Status', desc: 'Know Your Business verification status.', x: 80, y: 200, icon: 'verified' },
      { id: 'n3', type: 'OPERATOR', title: 'OR', desc: 'At least one input must be true.', x: 280, y: 140, icon: 'alt_route' },
      { id: 'n4', type: 'ACTION', title: 'Request Documentation', desc: 'Request additional documentation.', x: 480, y: 80, icon: 'folder_open' },
      { id: 'n5', type: 'ACTION', title: 'Suspend Pending Review', desc: 'Suspend until compliance review.', x: 480, y: 200, icon: 'pause_circle' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n3', type: 'solid' },
      { id: 'c2', from: 'n2', to: 'n3', type: 'solid' },
      { id: 'c3', from: 'n3', to: 'n4', type: 'dashed' },
      { id: 'c4', from: 'n3', to: 'n5', type: 'dashed' },
    ],
    weights: DEFAULT_WEIGHTS,
  },
];

export const FCA_PREDEFINED_IDS = new Set(FCA_PREDEFINED_RULES.map((r) => r.id));

export function isPredefinedRuleId(id: string): boolean {
  return FCA_PREDEFINED_IDS.has(id);
}
