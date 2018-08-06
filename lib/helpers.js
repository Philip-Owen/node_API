// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('./config');


// Container for helpers
const helpers = {};

// Create SHA256 hash
helpers.hash = str => {
  if(typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse JSON string to an object in all cases without throwing
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (error) {
    return {};
  }
};



// export helpers
module.exports = helpers;
