function createWorker(config, utils) {
  var channels = config.redis.channels;
  var redisClients = utils.createRedisClients();
  var redisPublisher = redisClients.publisher;
  var redisSubscriber = redisClients.subscriber;

  var workerMode = true;

  function waitForMessage() {
    return redisSubscriber.brpop(channels.messages, 0, onMessage);
  }

  function stopWaitingForMessage() {
    console.log('switching to master mode');
    workerMode = false;
    return redisSubscriber.quit();
  }

  function onMessage(error, data) {
    var message = data[1];
    console.log('handling message: ' + message);
    return eventHandler(message, function onMessageHandled(error, message) {
      if (error) {
        return onError(message);
      }
      console.log('message handled successfully: ' + message);
      if (workerMode) {
        return waitForMessage();
      }
    });
  }

  function eventHandler(msg, callback) {
    function onComplete() {
      var error = Math.random() > 0.85;
      callback(error, msg);
    }
    // processing takes time...
    setTimeout(onComplete, Math.floor(Math.random() * 1000));
  }

  function onError(message) {
    console.error('error occured while handling message: ' + message);
    return redisPublisher.lpush(channels.errors, message, function onErrorPushed() {
      return waitForMessage();
    });
  }

  return {
    waitForMessage: waitForMessage,
    stopWaitingForMessage: stopWaitingForMessage,
  };
}

module.exports = createWorker;
