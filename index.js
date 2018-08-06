
// Primary file for API

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiate the HTTP server
const httpServer = http.createServer((req,res) => {
  unifiedServer(req,res);
});

// Start HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(`Server is listening on port ${config.httpPort}`);
});

// Instantiate HTTPS server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem'),
};

const httpsServer = https.createServer(httpsServerOptions, (req,res) => {
  unifiedServer(req,res);
});


// Start HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`Server is listening on port ${config.httpsPort}`);
});


// Server logic for HTTP & HTTPS
const unifiedServer = (req,res) => {

  // Get URL and parse
  const parsedUrl = url.parse(req.url, true);

  // Get URL path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get HTTP Method
  const method = req.method.toLowerCase();

  // Get headers as an object
  const headers = req.headers;

  // Get payload if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', data => buffer += decoder.write(data));

  req.on('end', () => {
    buffer += decoder.end();

    // choose handler this req should go to. if not found use notfound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // construct data object to send to handlers
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      'payload': buffer,
    };

    // route req to handler specified in router
    chosenHandler(data, (statusCode, payload) => {

      // use the status code called back by the handler or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // use the payload called back by handler or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // convert payload to string
      const payloadString = JSON.stringify(payload);

      // return response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log(`Returning response: `, statusCode, payloadString);
    });
  });
};

// define handlers
const handlers = {};

// Sample handler
// handlers.sample = (data, callback) => {
//   // callback a http status code, and a payload = object
//   callback(406, {'name': 'sample handler'});
// };

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Define request router
const router = {
  'ping': handlers.ping,
};
