
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
  req.on('data', data => {
    
    buffer += decoder.write(data);
  });
  req.on('end', () => {

    buffer += decoder.end();

    // Send res
    res.end('Hello World\n');

    // Log headers
    console.log(`Request recieved with this payload: `, buffer);
  });

});

server.listen(3000,() => {
  console.log("Server is listening on port 3000");
});
