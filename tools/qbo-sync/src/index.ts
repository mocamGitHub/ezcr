import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getAuthUrl, exchangeAuthCode } from './qbo/oauth.js';
import { syncFull } from './qbo/sync_full.js';
import { syncCdc } from './qbo/sync_cdc.js';

const argv = yargs(hideBin(process.argv))
  .command('auth-url', 'Print Intuit OAuth2 consent URL', () => {}, async () => {
    const url = getAuthUrl();
    console.log(url);
  })
  .command('auth-exchange', 'Exchange auth code for tokens', (y) => y
    .option('code', { type: 'string', demandOption: true })
    .option('realmId', { type: 'string', demandOption: true }),
    async (args) => {
      const tokens = await exchangeAuthCode(args.code as string, args.realmId as string);
      console.log(JSON.stringify(tokens, null, 2));
    }
  )
  .command('sync', 'Sync QBO data into Postgres', (y) => y
    .option('mode', { choices: ['full', 'cdc'] as const, demandOption: true })
    .option('since', { type: 'string', describe: 'Override CDC changedSince ISO timestamp (optional)' })
    .option('entities', { type: 'string', describe: 'Comma-separated list of entities (optional override)' }),
    async (args) => {
      const mode = args.mode as 'full' | 'cdc';
      if (mode === 'full') await syncFull({ entitiesCsv: args.entities as string | undefined });
      else await syncCdc({ sinceIso: args.since as string | undefined, entitiesCsv: args.entities as string | undefined });
    }
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();

await argv;
