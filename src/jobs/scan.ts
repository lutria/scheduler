import * as process from 'node:process'
import { parentPort } from 'node:worker_threads'
import got from 'got'
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL })

interface Source {
  name: string
}

async function main() {
  logger.info("Scanning for stale sources")

  // Make request to API Service
  const sources: Source[] = await got.get(`${process.env.API_SERVICE_URL}/sources/stale`, {
    headers: {
      "x-user": process.env.API_USER
    }
  }).json()

  logger.debug(`Found ${sources.length} sources`)
}

main()
  .then(async () => {
    // signal to parent that the job is done
    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0)
    }
  })
  .catch(async (e) => {
    logger.error(e)

    if (parentPort) {
      parentPort.postMessage('failed')
    } else {
      process.exit(1)
    }
  })


