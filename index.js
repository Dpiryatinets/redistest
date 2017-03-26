var redis = require('redis');

var config = require('./config');
var createUtils = require('./components/utils');
var createAppHealthMonitor = require('./components/app-health-monitor');
var createAppWatcher = require('./components/app-watcher');
var createMaster = require('./components/master');
var createWorker = require('./components/worker');

var channels = config.redis.channels;
var utils = createUtils(config, redis);
var redisClients = utils.createRedisClients();
var redisPublisher = redisClients.publisher;
var redisSubscriber = redisClients.subscriber;
var appHealthMonitor = createAppHealthMonitor(config, utils);
var appWatcher = createAppWatcher(config, utils);
var master = createMaster(config, utils);
var worker = createWorker(config, utils);

redisSubscriber.get(channels.freeAppId, function onFreeAppId(error, freeAppId) {
  var appId = 0;
  if (error) {
    var message = "error occured while getting free app id" + error.message || error;
    throw new Error(message);
  }
  if (freeAppId) {
    appId = utils.parseAppId(freeAppId);
  }
  console.log('my app id is: ' + appId);
  redisPublisher.incr(channels.freeAppId);
  appHealthMonitor.setAppOnline(appId, false, function onAppOnlineSet() {
    redisSubscriber.subscribe(channels.masterElected);
    redisSubscriber.on('message', onMessage.bind({ appId: appId }));
    worker.waitForMessage();
    return appWatcher.start();
  });
});

function onMessage(channel, message) {
  if (channel === channels.masterElected) {
    return onMasterElected(this.appId, utils.parseAppId(message))
  }
}

function onMasterElected(appId, masterId) {
  if (appId === masterId) {
    console.log('app:' + masterId + ' - I am a master!');
    worker.stopWaitingForMessage();
    return appHealthMonitor.setAppOnline(appId, true, function onMasterSetOnline() {
      return master.startJob();
    });
  }
}
