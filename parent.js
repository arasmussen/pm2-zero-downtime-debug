log('Startup');

const http = require('http');

const ConcurrentRequestCount = 5;
const HTTPPort = '8080';
let OpenRequests = 0;
const Requests = [];
const TickTimeout = 500;

function main() {
  if (OpenRequests >= ConcurrentRequestCount) {
    setTimeout(main, TickTimeout);
    return;
  }

  const requestID = Requests.length;

  log('Request: Creating');
  const request = http.request({
    hostname: 'localhost',
    port: HTTPPort,
    path: '/',
    method: 'GET',
  }, (response) => {
    response.setEncoding('utf8');
    let body = '';
    response.on('data', (chunk) => {
      body += chunk;
    });
    response.on('end', () => {
      Requests[requestID].success = true;
      OpenRequests--;
      const end = new Date();
      log(`Request: Response (${body}, ${end - start}ms)`);
    });
  });
  request.on('error', (error) => {
    Requests[requestID].success = false;
    Requests[requestID].error = error;
    OpenRequests--;
    const end = new Date();
    log(`Request: Error (${error}, ${end - start}ms)`);
  });
  request.end();
  log('Request: Sent');

  OpenRequests++;
  const start = new Date();
  Requests[requestID] = {
    sentAt: start,
  };

  setTimeout(main, 0);
}

main();

function cleanup() {
  const TotalRequests = Requests.length;
  const CompletedRequests = Requests.filter((request) => {
    return typeof request.success === 'boolean';
  }).length;
  const SuccessfulRequests = Requests.filter((request) => {
    return request.success;
  }).length;
  const ErrorRequests = Requests.filter((request) => {
    return request.error;
  }).length;
  console.log(JSON.stringify({
    Total: TotalRequests,
    Completed: CompletedRequests,
    Successful: SuccessfulRequests,
    ErrorRequests: ErrorRequests,
  }));

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

function log(message) {
  console.log(`[parent][${new Date().toISOString()}] ${message}`);
}