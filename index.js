
// Primary file for API


// dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

// declare the app
const app = {};

// init function
app.init = function() {
  // start server
  server.init();
  // start workers
  workers.init();
};

// execute
app.init();

// export the app
module.exports = app;
