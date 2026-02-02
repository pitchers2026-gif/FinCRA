import express from 'express';
import cors from 'cors';
import { calculateCRA } from './craEngine.js';
import { DEFAULT_CRA_ENGINE_CONFIG } from '../types';
import type { CRAInput, CRAEngineConfig, CRAOutput } from '../types';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 3233;

app.post('/api/cra/calculate', (req, res) => {
  try {
    const body = req.body as {
      input: CRAInput;
      config?: CRAEngineConfig;
    };
    const input = body?.input;
    if (!input || typeof input !== 'object') {
      res.status(400).json({
        error: 'Bad request',
        message: 'Body must include { input: CRAInput }',
      });
      return;
    }
    const config = body.config ?? DEFAULT_CRA_ENGINE_CONFIG;
    const output: CRAOutput = calculateCRA(input, config);
    res.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CRA calculation failed';
    res.status(500).json({ error: 'Internal server error', message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fincra-cra-api' });
});

app.listen(PORT, () => {
  console.log(`CRA API listening on http://localhost:${PORT}`);
  console.log(`  POST /api/cra/calculate  { input: CRAInput, config?: CRAEngineConfig }`);
  console.log(`  GET  /api/health`);
});
