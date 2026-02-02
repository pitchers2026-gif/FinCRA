export type LogicBlockType = 'CONDITION' | 'OPERATOR' | 'ACTION';

export interface LogicBlock {
  id: string;
  name: string;
  desc: string;
  type: LogicBlockType;
  icon: string;
  category?: string;
}

export const LOGIC_BLOCKS: LogicBlock[] = [
  // --- CONDITIONS: Geography ---
  { id: 'cond-geo-profile', name: 'Geo Profile', desc: 'Geography scorecard lookup by country code.', type: 'CONDITION', icon: 'public', category: 'Geography' },
  { id: 'cond-country-high-risk', name: 'Country High Risk', desc: 'Check if country is on UK High-Risk list.', type: 'CONDITION', icon: 'warning', category: 'Geography' },
  { id: 'cond-prohibited-jurisdiction', name: 'Prohibited Jurisdiction', desc: 'Country is on prohibited list.', type: 'CONDITION', icon: 'block', category: 'Geography' },
  { id: 'cond-uk-high-risk-list', name: 'UK High-Risk List', desc: 'Entity domicile matches UK AML high-risk jurisdictions.', type: 'CONDITION', icon: 'list_alt', category: 'Geography' },
  { id: 'cond-offshore-domicile', name: 'Offshore Domicile', desc: 'Entity incorporated in offshore jurisdiction.', type: 'CONDITION', icon: 'travel_explore', category: 'Geography' },

  // --- CONDITIONS: Screening ---
  { id: 'cond-id-verify', name: 'ID Verify', desc: 'Identity verification status check.', type: 'CONDITION', icon: 'verified_user', category: 'Screening' },
  { id: 'cond-sanctions-match', name: 'Sanctions Match', desc: 'Direct sanctions list match identified.', type: 'CONDITION', icon: 'gavel', category: 'Screening' },
  { id: 'cond-pep-list-match', name: 'PEP List Match', desc: 'FCA PEP database match.', type: 'CONDITION', icon: 'person_search', category: 'Screening' },
  { id: 'cond-adverse-media', name: 'Adverse Media', desc: 'Adverse media or negative news match.', type: 'CONDITION', icon: 'newspaper', category: 'Screening' },
  { id: 'cond-bearer-shares', name: 'Bearer Shares', desc: 'Entity has bearer shares (high risk indicator).', type: 'CONDITION', icon: 'receipt_long', category: 'Screening' },

  // --- CONDITIONS: Entity ---
  { id: 'cond-credit-tier', name: 'Credit Tier', desc: 'Credit or risk tier classification.', type: 'CONDITION', icon: 'credit_score', category: 'Entity' },
  { id: 'cond-entity-type', name: 'Entity Type', desc: 'Entity type scorecard lookup (e.g. Limited, LLP).', type: 'CONDITION', icon: 'business', category: 'Entity' },
  { id: 'cond-shell-company', name: 'Shell Company Indicators', desc: 'Signs of shell company (no employees, no premises).', type: 'CONDITION', icon: 'account_balance', category: 'Entity' },
  { id: 'cond-ubo-transparency', name: 'UBO Transparency', desc: 'Ultimate beneficial owner transparency check.', type: 'CONDITION', icon: 'group', category: 'Entity' },
  { id: 'cond-registration-age', name: 'Registration Age', desc: 'Entity registration or incorporation age.', type: 'CONDITION', icon: 'schedule', category: 'Entity' },

  // --- CONDITIONS: Industry ---
  { id: 'cond-industry-crypto', name: 'Industry Crypto', desc: 'Crypto or cryptocurrency industry.', type: 'CONDITION', icon: 'currency_bitcoin', category: 'Industry' },
  { id: 'cond-industry-cbd', name: 'Industry CBD', desc: 'CBD or cannabis-related industry.', type: 'CONDITION', icon: 'grass', category: 'Industry' },
  { id: 'cond-adult-entertainment', name: 'Adult Entertainment', desc: 'Adult entertainment industry (SIC filter).', type: 'CONDITION', icon: 'visibility', category: 'Industry' },
  { id: 'cond-regulated-sector', name: 'Regulated Sector', desc: 'Entity operates in FCA regulated sector.', type: 'CONDITION', icon: 'policy', category: 'Industry' },

  // --- CONDITIONS: Product / Delivery ---
  { id: 'cond-product-type', name: 'Product Type', desc: 'Product or account type scorecard lookup.', type: 'CONDITION', icon: 'inventory_2', category: 'Product' },
  { id: 'cond-delivery-channel', name: 'Delivery Channel', desc: 'Delivery channel score (online, branch, etc.).', type: 'CONDITION', icon: 'devices', category: 'Product' },
  { id: 'cond-cash-intensity', name: 'Cash Intensity', desc: 'High cash transaction volume or cash-intensive business.', type: 'CONDITION', icon: 'payments', category: 'Product' },
  { id: 'cond-transaction-volume', name: 'Transaction Volume', desc: 'Transaction volume threshold check.', type: 'CONDITION', icon: 'trending_up', category: 'Product' },

  // --- CONDITIONS: Other ---
  { id: 'cond-kyb-status', name: 'KYB Status', desc: 'Know Your Business verification status.', type: 'CONDITION', icon: 'verified', category: 'Other' },
  { id: 'cond-document-expiry', name: 'Document Expiry', desc: 'ID or KYB document expiry date check.', type: 'CONDITION', icon: 'event_busy', category: 'Other' },
  { id: 'cond-source-of-funds', name: 'Source of Funds', desc: 'Source of funds verification status.', type: 'CONDITION', icon: 'savings', category: 'Other' },

  // --- OPERATORS ---
  { id: 'op-and', name: 'AND', desc: 'All inputs must be true.', type: 'OPERATOR', icon: 'alt_route', category: 'Operators' },
  { id: 'op-or', name: 'OR', desc: 'At least one input must be true.', type: 'OPERATOR', icon: 'alt_route', category: 'Operators' },
  { id: 'op-not', name: 'NOT', desc: 'Inverts the input (true becomes false).', type: 'OPERATOR', icon: 'toggle_off', category: 'Operators' },
  { id: 'op-xor', name: 'XOR', desc: 'Exactly one input must be true.', type: 'OPERATOR', icon: 'compare_arrows', category: 'Operators' },

  // --- ACTIONS: Escalation ---
  { id: 'act-flag-alert', name: 'Flag Alert', desc: 'Flag for review or alert.', type: 'ACTION', icon: 'flag', category: 'Escalation' },
  { id: 'act-manual-edd', name: 'Manual EDD', desc: 'Enhanced Due Diligence required.', type: 'ACTION', icon: 'assignment_ind', category: 'Escalation' },
  { id: 'act-escalate-mlro', name: 'Escalate to MLRO', desc: 'Escalate to Money Laundering Reporting Officer.', type: 'ACTION', icon: 'campaign', category: 'Escalation' },
  { id: 'act-review-required', name: 'Review Required', desc: 'Manual compliance review required.', type: 'ACTION', icon: 'rate_review', category: 'Escalation' },

  // --- ACTIONS: Blocking ---
  { id: 'act-block-tx', name: 'Block Tx', desc: 'Block transaction.', type: 'ACTION', icon: 'block', category: 'Blocking' },
  { id: 'act-block-account', name: 'Block Account', desc: 'Block or freeze account.', type: 'ACTION', icon: 'lock', category: 'Blocking' },
  { id: 'act-suspend-pending', name: 'Suspend Pending Review', desc: 'Suspend until compliance review.', type: 'ACTION', icon: 'pause_circle', category: 'Blocking' },

  // --- ACTIONS: Requests ---
  { id: 'act-request-docs', name: 'Request Documentation', desc: 'Request additional documentation.', type: 'ACTION', icon: 'folder_open', category: 'Requests' },
  { id: 'act-request-sof', name: 'Request Source of Funds', desc: 'Request source of funds evidence.', type: 'ACTION', icon: 'request_quote', category: 'Requests' },
  { id: 'act-request-ubo', name: 'Request UBO Details', desc: 'Request ultimate beneficial owner details.', type: 'ACTION', icon: 'contact_page', category: 'Requests' },

  // --- ACTIONS: Tiering ---
  { id: 'act-enhanced-monitoring', name: 'Apply Enhanced Monitoring', desc: 'Apply enhanced transaction monitoring.', type: 'ACTION', icon: 'monitoring', category: 'Tiering' },
  { id: 'act-downgrade-tier', name: 'Downgrade Risk Tier', desc: 'Downgrade entity risk tier.', type: 'ACTION', icon: 'arrow_downward', category: 'Tiering' },
  { id: 'act-standard-tier', name: 'Apply Standard Tier', desc: 'Apply standard risk tier.', type: 'ACTION', icon: 'horizontal_rule', category: 'Tiering' },

  // --- ACTIONS: Logging ---
  { id: 'act-log-audit', name: 'Log for Audit', desc: 'Log event for audit trail.', type: 'ACTION', icon: 'history', category: 'Logging' },
  { id: 'act-create-sar', name: 'Create SAR Referral', desc: 'Create Suspicious Activity Report referral.', type: 'ACTION', icon: 'report', category: 'Logging' },
];

export const CONDITION_CATEGORIES = ['Geography', 'Screening', 'Entity', 'Industry', 'Product', 'Other'];
export const OPERATOR_CATEGORY = 'Operators';
export const ACTION_CATEGORIES = ['Escalation', 'Blocking', 'Requests', 'Tiering', 'Logging'];

export const CONDITION_NAMES = LOGIC_BLOCKS.filter(b => b.type === 'CONDITION').map(b => b.name);
export const OPERATOR_NAMES = LOGIC_BLOCKS.filter(b => b.type === 'OPERATOR').map(b => b.name);
export const ACTION_NAMES = LOGIC_BLOCKS.filter(b => b.type === 'ACTION').map(b => b.name);

export function findBlockByName(name: string): LogicBlock | undefined {
  return LOGIC_BLOCKS.find(b => b.name === name);
}

export function getBlocksByCategory(): { type: LogicBlockType; category: string; blocks: LogicBlock[] }[] {
  const result: { type: LogicBlockType; category: string; blocks: LogicBlock[] }[] = [];
  const conditionCats = [...CONDITION_CATEGORIES];
  const actionCats = [...ACTION_CATEGORIES];

  for (const cat of conditionCats) {
    const blocks = LOGIC_BLOCKS.filter(b => b.type === 'CONDITION' && b.category === cat);
    if (blocks.length > 0) result.push({ type: 'CONDITION', category: cat, blocks });
  }

  const opBlocks = LOGIC_BLOCKS.filter(b => b.type === 'OPERATOR');
  if (opBlocks.length > 0) result.push({ type: 'OPERATOR', category: OPERATOR_CATEGORY, blocks: opBlocks });

  for (const cat of actionCats) {
    const blocks = LOGIC_BLOCKS.filter(b => b.type === 'ACTION' && b.category === cat);
    if (blocks.length > 0) result.push({ type: 'ACTION', category: cat, blocks });
  }

  return result;
}
