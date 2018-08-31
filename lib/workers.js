// Worker related tasks

// dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');

// instantiate worker object
const workers = {};

// lookup all checks, get their data, send to a validator
workers.gatherAllChecks = () => {
    // get all checks
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                // read in check data
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        // pass it to check validator, let continue or log errs
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of the checks data');
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process');

        }
    });
};

// Sanity-check the check data
workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // set keys that may not be set if workers have not seen this check
    originalCheckData.state =  typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // if all the checks pass, pass data along to next step
    if (originalCheckData.id && originalCheckData.userPhone && originalCheckData.protocol && originalCheckData.url && originalCheckData.method && originalCheckData.successCodes && originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log('Error: One of the checks is not properly formatted. Skipping it.');
    }
};

// perform check, send originalcheckdata and outcome of check to next process
workers.performCheck = (originalCheckData) => {
    // prepare initial check outcome
    let checkOutcome = {
        'error': false,
        'responseCode': false,
    };

    // Mark that the outcome has not been sent yet
    let outcomeSent = false;

    // parse hostname and path out of original check data
    const parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path; // using path and not pathname because we want the query string

    // construct the request
    const requestDetails = {
        'protocol': originalCheckData.protocol+':',
        'hostname': hostName,
        'method': originalCheckData.method.toUpperCase(),
        'timeout': originalCheckData.timeoutSeconds * 1000,
        path,
    };

    // instantiate request obj using http or https module
    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;

    const req = _moduleToUse.request(requestDetails, (res) => {
        // grab status of the sent request
        const status = res.statusCode;

        // update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // bind to error event so it doesnt get thrown
    req.on('error', (e) => {
        // update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': e,
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // bind to the timeout event
    req.on('timeout', (e) => {
        // update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout',
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // end the request
    req.end();
};

// process the check outcome, update the check data as needed and alert user
// special logic for a check that has never been tested before (dont alert on this case)
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
    // decide if the check is considered up or down
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // decide if alert is warranted
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    let timeOfcheck = Date.now();
    // log the outcome of the check
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfcheck);

    // update the check data
    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfcheck;

    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            // send new check data to the next phase in the process if needed
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert needed');

            }
        } else {
            console.log('Error tyring to save updates to one of the checks.');
        }
    });
};

// aler the user as to a change in their check status
workers.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
  helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
     if (!err) {
         console.log('Success: User was alerted to a status change in their check via sms', msg);
     } else {
         console.log('Error: Could not send SMS alert to user who had a state change in their check.');
     }
  });
};

workers.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfcheck) => {
  // form the log data
  const logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state': state,
    'alert': alertWarranted,
    'time': timeOfcheck,
  };
  // convert data to string
  const logString = JSON.stringify(logData);

  // deterime the name of the log file
  const logFileName = originalCheckData.id;

  // append log string to file
  _logs.append(logFileName, logString, err => {
    if (!err) {
      console.log('Logging to file succeeded');
    } else {
      console.log('Logging to file failed');
    }
  });
};

// timer to execute worker processes once per min
workers.loop = () => {
  setInterval(() => {
      workers.gatherAllChecks();
  }, 1000 * 5);
};

// init script
workers.init = () => {
    // execute all the checks immediately
    workers.gatherAllChecks();
    // call the loop so checks will execute later on
    workers.loop();
};

// export
module.exports = workers;
