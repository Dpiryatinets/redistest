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
      freeAppId: 'redistest:app:id:free',
      appsOnline: 'redistest:apps:online',
      appMaster: 'redistest:apps:master',
      masterElected: 'redistest:apps:master:elected',
      messages: 'redistest:messages',
      errors: 'redistest:errors',
    }
  },
};

module.exports = config;
