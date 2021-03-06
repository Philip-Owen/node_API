// Server related tasks

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

// instantiate the server module object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req,res) => {
  server.unifiedServer(req,res);
});

// Instantiate HTTPS server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req,res) => {
  server.unifiedServer(req,res);
});

// Server logic for HTTP & HTTPS
server.unifiedServer = (req,res) => {

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
    const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // construct data object to send to handlers
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      'payload': helpers.parseJsonToObject(buffer),
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

// Define request router
server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks,
};

server.init = () => {

    // Start HTTP server
    server.httpServer.listen(config.httpPort, () => {
        console.log(`Server is listening on port ${config.httpPort}`);
    });
    // Start HTTPS server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log(`Server is listening on port ${config.httpsPort}`);
    });
}

module.exports = server;