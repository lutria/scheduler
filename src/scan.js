import * as dotenv from 'dotenv'
dotenv.config()

import * as process from 'node:process'
import axios from 'axios'
import pino from 'pino'

const apiServiceUrl = process.env.API_SERVICE_URL
const apiUser = process.env.API_USER
const authHeader = "x-user"

const logger = pino({ level: process.env.LOG_LEVEL })

const STREAM_SCAN_REQUEST_SUBJECT = "work.stream_scan_request"

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

  logger.info(`Sending message to ${STREAM_SCAN_REQUEST_SUBJECT} for stream ${streamId}`)

  await natsClient.publish(STREAM_SCAN_REQUEST_SUBJECT, message)
  // logger.info(`Updating stream with id ${stream.id}`)

  // const data = {
    // state: "SCAN_REQUESTED"
  // }

  // const url = `${apiServiceUrl}/stream/${stream.id}`
  // logger.debug(`Url: ${url}`)

  // const response = await axios.put(url, data, {
    // headers: {
      // [authHeader]: apiUser
    // }
  // })

  // logger.debug(`Got response code: ${response.status}`)
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
