function createMaster(config, utils) {
  var redisPublisher = utils.createRedisPublisher();

  function startJob() {
    setInterval(masterJob, config.masterJobIntervalMs);
  }

  function masterJob() {
    var message = getMessage();
    console.log('sending message: ' + message);
    return redisPublisher.lpush(config.redis.channels.messages, message);
  }

  function getMessage() {
    this.cnt = this.cnt || 0;
    return this.cnt++;
  }

  return {
    startJob: startJob,
  };
}

module.exports = createMaster;
