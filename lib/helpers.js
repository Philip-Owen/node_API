// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');


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


// Send SMS via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // validate parameters
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg : false;

  if (phone && msg) {
    // Config request payload to send
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+1'+ phone,
      'Body': msg,
    };

    // stringify the payload
    const stringPayload = querystring.stringify(payload);
    // configure request details
    const requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers' : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      }
    };

    // Instantiate the request object
    const req = https.request(requestDetails, res => {
      // grab status of sent request
      const status = res.statusCode;
      // callback success if request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback(`Status code returned was ${status}`);
      }
    });

    // bind to err so it doesnt get thrown
    req.on('error', e => {
      callback(e);
    });

    // add payload to req
    req.write(stringPayload);

    // end request
    req.end();

  } else {
    callback('Given parameters were missing or invalid');
  }

};



// export helpers
module.exports = helpers;
