function createUtils(config, redis) {
  var channels = config.redis.channels;
  var connectionOptions = config.redis.connectionOptions;
  var redisPublisher = redis.createClient(connectionOptions);

  function getAppOnlineKey(appId) {
    return channels.appsOnline + ':' + appId;
  }

  function parseAppId(appId) {
    return parseInt(appId, 10);
  }

  function createRedisPublisher() {
    return redisPublisher;
  }

  function createRedisClients() {
    return {
      publisher: redisPublisher,
      subscriber: redis.createClient(connectionOptions),
    };
  }

  return {
    getAppOnlineKey: getAppOnlineKey,
    parseAppId: parseAppId,
    createRedisClients: createRedisClients,
    createRedisPublisher: createRedisPublisher,
  };
}

module.exports = createUtils;
