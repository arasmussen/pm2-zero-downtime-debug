log('Startup');

const http = require('http');

const CleanupTimeout = 30000;
const HTTPPort = 8080;
const RequestTimeout = 5000;

log('Server: Creating');
const server = http.createServer((request, response) => {
  log('Request: Received');
  setTimeout(() => {
    const textResponse = 'success';
    const headers = {
      'Content-Length': Buffer.byteLength(textResponse, 'utf8'),
      'Content-Type': 'text/plain',
    }
    response.writeHead(200, {});
    response.end(textResponse);
    log('Request: Responded');
  }, RequestTimeout);
})
server.keepAliveTimeout = 75000;
server.headersTimeout = 80000;

server.on('listening', () => {
  log('Server: listening');
});
server.listen(HTTPPort);

if (process.send) {
  log('PM2: Sending `ready`');
  process.send('ready');
} else {
  log('PM2: Sending `ready` (no process.send)');
}

const cleanup = async function() {
  log('Exit: Starting');

  setTimeout(() => {
    log('Exit: Failed');
    process.exit(1);
  }, CleanupTimeout);

  console.log('Server: Closing');
  await promisify(server.close.bind(server));
  console.log('Server: Closed');

  log('Exit: Succeeded');
  process.exit(0);
}

process.on('SIGINT', () => {
  log('Signal: SIGINT');
  cleanup();
});
process.on('SIGTERM', () => {
  log('Signal: SIGTERM');
  cleanup();
});
process.on('SIGUSR2', () => {
  log('Signal: SIGUSR2');
  cleanup();
});

const promisify = (functor, ...args) => new Promise((resolve, reject) => {
  try {
    functor(...args, (error, result) => {
      if (error) {
        reject(error);
      }
      resolve(result);
    });
  } catch (error) {
    reject(error);
  }
});


function log(message) {
  console.log(`[child][${new Date().toISOString()}] ${message}`);
}