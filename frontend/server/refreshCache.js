const { refreshCache } = require('./cacheRefreshService');

console.log('Starting manual cache refresh...');
refreshCache()
  .then(() => {
    console.log('Cache refresh completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Cache refresh failed:', error);
    process.exit(1);
  }); 