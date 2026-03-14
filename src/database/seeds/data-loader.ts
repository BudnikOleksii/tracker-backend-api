import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TransactionData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadTransactionData(): TransactionData[] {
  const dataPath = path.join(__dirname, '..', 'data', 'transactions-02.03.25.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');

  return JSON.parse(rawData) as TransactionData[];
}
