import * as dotenv from 'dotenv'
dotenv.config()

import * as path from 'node:path'
import { fileURLToPath } from 'node:url';
import Bree from 'bree';
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL })

process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});

const bree = new Bree({
  logger: logger,
  jobs: [{
    name: 'scan',
    interval: '10s'
  }],
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs')
});

await bree.start()
