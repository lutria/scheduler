import * as dotenv from 'dotenv'
dotenv.config()

import axios from 'axios'
import pino from 'pino'
import { subjects } from '@lutria/nats-common/src/index.js'

const apiServiceUrl = process.env.API_SERVICE_URL
const apiUser = process.env.API_USER
const authHeader = "x-user"

const logger = pino({ level: process.env.LOG_LEVEL })

async function scanStream(natsClient, stream) {
  const { id: streamId, name, scanCursor, externalId, externalType, security } = stream

  const message = {
    streamId,
    name,
    scanCursor,
    externalId,
    externalType,
    security
  }

  logger.info(`Sending message to ${subjects.STREAM_SCAN_REQUEST} for stream ${streamId}`)

  await natsClient.publish(subjects.STREAM_SCAN_REQUEST, message)
}

export async function scan(natsClient) {
  logger.info("Scanning for stale streams")

  // Get list of stale streams from API service
  const response = await axios.get(`${apiServiceUrl}/streams/stale`, {
    headers: {
      [authHeader]: apiUser
    }
  })

  const streams = response.data;

  logger.debug(`Found ${streams.length} streams`)

  for (const stream of streams) {
    try {
      await scanStream(natsClient, stream)
    } catch (e) {
      logger.error(`uh -oh: ${e.message}`)
    }
  }
}
