
// Primary file for API

// Dependencies
const http = require('http');
const url = require('url');

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

  // Send res
  res.end('Hello World\n');

  // Log req path
  console.log(`Request recieved on path:'${trimmedPath}' with method:'${method}' and with these query string params:`, queryStringObject);

});

server.listen(3000,() => {
  console.log("Server is listening on port 3000");
});
