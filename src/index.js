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
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'jobs'),
  jobs: [{
    name: 'scan',
    interval: '10s'
  }],
  outputWorkerMetadata: true,
  errorHandler: (error, workerMetadata) => {
    // workerMetadata will be populated with extended worker information only if
    // Bree instance is initialized with parameter `workerMetadata: true`
    if (workerMetadata.threadId) {
      logger.info(`There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`)
    } else {
      logger.info(`There was an error while running a worker ${workerMetadata.name}`)
    }

    logger.error(error);
  },
  workerMessageHandler: (payload) => {
    const name = 'name' in payload ? payload.name : ''
    const message = 'message' in payload ? payload.message : ''
    logger.info(`Message from worker (${name}): ${message}`)
  },
});

await bree.start()
