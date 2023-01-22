import * as dotenv from 'dotenv'
dotenv.config()

import cron from 'node-cron'
import pino from 'pino'
import { scan } from './scan.js'

const logger = pino({ level: process.env.LOG_LEVEL })

process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});

cron.schedule('*/10 * * * * *', async () => {
  try {
    await scan()
  } catch (e) {
    logger.error(e)
  }
})
