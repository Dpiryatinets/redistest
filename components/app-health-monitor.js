function createAppHealthMonitor(config, utils) {
  var channels = config.redis.channels;
  var redisClients = utils.createRedisClients();
  var redisPublisher = redisClients.publisher;
  var redisSubscriber = redisClients.subscriber;

  function setAppOnline(appId, isMaster, callback) {
    if (isMaster) {
      return setMasterOnline(appId, callback);
    }
    return setWorkerOnline(appId, callback);
  }

  function setMasterOnline(appId, callback) {
    return redisPublisher.set(channels.appMaster, appId, function onMasterSetOnline(error) {
      setAppOnlineExpireInterval(channels.appMaster);
      return callback();
    });
  }

  function setWorkerOnline(appId, callback) {
    var appOnlineKey = utils.getAppOnlineKey(appId, channels);
    return redisPublisher.set(appOnlineKey, appId, function onAppOnlineSet(error) {
      if (error) {
        return callback(error);
      }
      return redisPublisher.sadd(channels.appsOnline, appId, function onAppAddedToOnlineList(error) {
        if (error) {
          return callback(error);
        }
        setAppOnlineExpireInterval(appOnlineKey);
        return callback();
      });
    });
  }

  function setAppOnlineExpireInterval(appOnlineKey) {
    return setInterval(setAppOnlineExpire.bind({ appOnlineKey: appOnlineKey }), config.appIdExpireIntervalMs);
  }

  function setAppOnlineExpire() {
    return redisPublisher.expire(this.appOnlineKey, config.appIdExpireS);
  }

  return {
    setAppOnline: setAppOnline,
  };
}

module.exports = createAppHealthMonitor;
