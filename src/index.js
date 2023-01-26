import * as dotenv from 'dotenv'
dotenv.config()

import cron from 'node-cron'
import pino from 'pino'
import { NatsClient } from '@lutria/nats-common/src/index.js'
import { scan } from './scan.js'

const logger = pino({ level: process.env.LOG_LEVEL })

const natsClient = new NatsClient({
  logger,
  name: 'scheduler',
  servers: process.env.NATS_URL,
})

await natsClient.connect()

const gracefulShutdown = () => {
  logger.info('Shutting down')

  natsClient.disconnect()
    .finally(() => {
      process.exit(0)
    })
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

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
    await scan(natsClient)
  } catch (e) {
    logger.error(e)
  }
})
