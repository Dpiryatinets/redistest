function createAppWatcher(config, utils) {
  var channels = config.redis.channels;
  var redisClients = utils.createRedisClients();
  var redisPublisher = redisClients.publisher;
  var redisSubscriber = redisClients.subscriber;
  var parseAppId = utils.parseAppId;
  var getAppOnlineKey = utils.getAppOnlineKey;

  function start() {
    checkMaster();
    return setInterval(checkMaster, 5000);
  }

  function checkMaster() {
    return redisSubscriber.get(channels.appMaster, function onAppMasterId(error, masterId) {
      if (error) {
        console.error('error occured while getting master app id: ' + error.message || error);
      }
      if (!masterId) {
        console.log('no master found, searching for new one');
        return searchForMaster();
      }
      console.log('master is up: ' + masterId);
    })
  }

  function searchForMaster() {
    return redisSubscriber.smembers(channels.appsOnline, function onAppsOnline(error, appsOnline) {
      if (error) {
        return console.error('error occured while getting master app id: ' + error.message || error);
      }
      if (!appsOnline.length) {
        return console.log('applications online list is empty');
      }
      var supposedMasterAppId = Math.min.apply(Math, appsOnline.map(parseAppId));
      var supposedMasterOnlineKey = getAppOnlineKey(supposedMasterAppId);
      return redisSubscriber.get(supposedMasterOnlineKey, function onAppOnlineKeyFound(error, appId) {
        if (error) {
          return console.error('error occured while getting supposed master app id: ' + error.message || error);
        }
        if (appId) {
          console.log('found new master: ' + appId);
          return redisPublisher.publish(channels.masterElected, appId);
        }
        console.log('app ' + supposedMasterAppId + ' is down! deleting from online apps list');
        return redisPublisher.srem(channels.appsOnline, supposedMasterAppId, function onAppIdRemoved(error) {
          if (error) {
            console.error('error occured while removing dead master app id: ' + error.message || error);
          }
          return searchForMaster();
        })
      });
    });
  }

  return { start: start };
}

module.exports = createAppWatcher;
