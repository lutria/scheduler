import { connect, JSONCodec, RetentionPolicy } from 'nats'

class NatsClient {
  constructor(config = {}) {
    Object.assign(
      this,
      {
        logger: config.logger,
        servers: config.servers
      }
    )

    this.jsonCodec = JSONCodec()
  }

  async connect() {
    this.nc = await connect({
      servers: this.servers.split(',')
    })

    // Access the JetStream manager which provides the methods for managing streams and consumers.
    const jsm = await this.nc.jetstreamManager()

    // Declare the initial stream config. A stream can bind one or more subjects that are not overlapping with
    // other streams. By default, a stream will have one replica and use file storage.
    const cfg = {
      name: "WORK",
      retention: RetentionPolicy.Workqueue,
      subjects: ["work.>"]
    }

    // Add/create the stream
    await jsm.streams.add(cfg)
    this.logger.info(`Created stream with name: ${cfg.name}`)

    // Access the JetStream client for publishing and subscribing to streams.
    this.js = this.nc.jetstream()
  }

  async disconnect() {
    // Finally we drain the connection which waits for any pending
    // messages (published or in a subscription) to be flushed.
    await this.nc.drain()

    await this.nc.close()
  }

  async publish(subject, data) {
    // Publish a series of messages and wait for each one to be completed.
    await this.js.publish(subject, this.jsonCodec.encode(data));
  }
}

export default NatsClient
