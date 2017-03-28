var redis = require('redis');
var parseArgs = require('minimist');

var config = require('./config');
var createUtils = require('./components/utils');
var createAppHealthMonitor = require('./components/app-health-monitor');
var createAppWatcher = require('./components/app-watcher');
var createMaster = require('./components/master');
var createWorker = require('./components/worker');

var channels = config.redis.channels;
var utils = createUtils(config, redis);
var appHealthMonitor = createAppHealthMonitor(config, utils);
var appWatcher = createAppWatcher(config, utils);
var master = createMaster(config, utils);
var worker = createWorker(config, utils);
var redisClients = utils.createRedisClients();
var redisPublisher = redisClients.publisher;
var redisSubscriber = redisClients.subscriber;

function handleErrorsOrStart() {
  var args = parseArgs(process.argv.slice(2));
  if (args._.indexOf(config.parseErrorsCommand) !== -1) {
    console.log('handling errors and exiting...');
    return handleErrorsAndExit();
  }
  console.log('initiating application...');
  return initMessageHandler();
}

function handleErrorsAndExit() {
  return redisSubscriber.lrange(channels.errors, 0, -1, function onErrors(error, errorsArray) {
    return redisPublisher.del(channels.errors, function onErrorsDeleted() {
      console.log('errors: [ ' + errorsArray.reverse().join(', ') + ' ]');
      return process.exit();
    });
  });
}

function initMessageHandler() {
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
    appHealthMonitor.setAppOnline(appId, false, function onAppOnlineSet(error) {
      if (error) {
        var message = "error occured while setting app online: " + error.message || error;
        throw new Error(message);
      }
      redisSubscriber.subscribe(channels.masterElected);
      redisSubscriber.on('message', function onMessage(channel, message) {
        if (channel === channels.masterElected) {
          return onMasterElected(appId, utils.parseAppId(message));
        }
      });
      appWatcher.start();
      return worker.waitForMessage();
    });
  });
}

function onMasterElected(appId, masterId) {
  if (appId === masterId) {
    console.log('app:' + masterId + ' - I am a master!');
    worker.stopWaitingForMessage();
    return appHealthMonitor.setAppOnline(appId, true, function onMasterSetOnline(error) {
      if (error) {
        var message = "error occured while setting master online: " + error.message || error;
        throw new Error(message);
      }
      return master.startJob();
    });
  }
}

handleErrorsOrStart();
