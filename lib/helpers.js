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

// Create a string of random alphanum char of a given length
helpers.createRandomString = strLength => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // define characters
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // start final string
    var str = '';
    for (let i = 1; i <= strLength; i++) {
      // get randomcharacter from possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      // append character to final string
      str += randomCharacter;
    }

    return str;
  } else {
    return false;
  }
};



// export helpers
module.exports = helpers;
