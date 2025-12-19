import pg from 'pg';
import { mustGet } from '../qbo/env.js';

export function getPool() {
  const url = mustGet('DATABASE_URL');
  return new pg.Pool({
    connectionString: url,
    max: 5,
    statement_timeout: 0,
  });
}
