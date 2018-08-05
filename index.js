
// Primary file for API

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req,res) => {

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
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log(`Returning response: `, statusCode, payloadString);
    });
  });
});

server.listen(3000,() => {
  console.log("Server is listening on port 3000");
});

// define handlers
const handlers = {};

// Sample handler
handlers.sample = (data, callback) => {
  // callback a http status code, and a payload = object
  callback(406, {'name': 'sample handler'});
};

// not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Define request router
const router = {
  'sample': handlers.sample,
};
