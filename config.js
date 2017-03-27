var config = {
  parseErrorsCommand: 'getErrors',
  appIdExpireIntervalMs: 1000,
  masterAppExpireIntervalMs: 1000,
  appIdExpireS: 10,
  masterAppExpireS: 10,
  masterJobIntervalMs: 500,
  redis: {
    connectionOptions: {
      host: '127.0.0.1',
      port: 6379,
    },
    channels: {
      freeAppId: 'onetwotrip:app:id:free',
      appsOnline: 'onetwotrip:apps:online',
      appMaster: 'onetwotrip:apps:master',
      masterElected: 'onetwotrip:apps:master:elected',
      messages: 'onetwotrip:messages',
      errors: 'onetwotrip:errors',
    }
  },
};

module.exports = config;
