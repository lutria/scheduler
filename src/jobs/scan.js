import * as process from 'node:process'
import { parentPort } from 'node:worker_threads'
import got from 'got'

const apiServiceUrl = process.env.API_SERVICE_URL
const apiUser = process.env.API_USER
const authHeader = "x-user"

async function scanSource(source) {
  await got.put(`${apiServiceUrl}/source/${source.id}`, {
    headers: {
      [authHeader]: apiUser
    },
    json: { state: SourceState.SCAN_REQUESTED }
  })
}

async function main() {
  parentPort?.postMessage("Scanning for stale sources")

  // Get list of stale sources from API service
  const sources = await got.get(`${apiServiceUrl}/sources/stale`, {
    headers: {
      [authHeader]: apiUser
    }
  }).json()

  parentPort?.postMessage(`Found ${sources.length} sources`)

  sources.forEach(source => scanSource(source))
}

try {
  await main()

  // signal to parent that the job is done
  if (parentPort) {
    parentPort.postMessage('done');
  } else {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0)
  }
} catch (e) {
  console.log(e)
  if (parentPort) {
    parentPort.postMessage({ error: e })
  } else {
    process.exit(1)
  }
}
