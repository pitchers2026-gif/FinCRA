import type { CRAEngineConfig, CRAInput, CRAOutput } from '../types';

const API_BASE = '/api';

/** Ping GET /api/health to see if the CRA backend is reachable. */
export async function checkCRAApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function calculateCRAViaApi(
  input: CRAInput,
  config: CRAEngineConfig
): Promise<CRAOutput> {
  const res = await fetch(`${API_BASE}/cra/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, config }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'CRA API request failed');
  }
  return res.json() as Promise<CRAOutput>;
}
