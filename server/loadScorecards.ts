import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCORECARDS_DIR = join(__dirname, 'scorecards');

export type Scorecard = Record<string, number>;

function loadJson(name: string): Scorecard {
  const path = join(SCORECARDS_DIR, `${name}.json`);
  try {
    const raw = readFileSync(path, 'utf-8');
    const obj = JSON.parse(raw) as Record<string, number>;
    const out: Scorecard = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && v >= 1 && v <= 5) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

let cached: {
  geography: Scorecard;
  industry: Scorecard;
  entity: Scorecard;
  product: Scorecard;
  delivery: Scorecard;
} | null = null;

export function getScorecards(): {
  geography: Scorecard;
  industry: Scorecard;
  entity: Scorecard;
  product: Scorecard;
  delivery: Scorecard;
} {
  if (!cached) {
    cached = {
      geography: loadJson('geography'),
      industry: loadJson('industry'),
      entity: loadJson('entity'),
      product: loadJson('product'),
      delivery: loadJson('delivery'),
    };
  }
  return cached;
}

export function clearScorecardCache(): void {
  cached = null;
}
