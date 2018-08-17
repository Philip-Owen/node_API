// Request Handlers

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');


const handlers = {};

// Users
handlers.users = (data, callback) => {

  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for user submethods
handlers._users = {};

// users post
// required data: firstName, lastName, phone, password, tosAgreement
// optional data: none
handlers._users.post = (data, callback) => {
  // check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10  ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that user doesnt already exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        // hash the password
        const hashedPassword = helpers.hash(password);

        // create user object
        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users', phone, userObject, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Could not create the new user'});
            }
          });
        } else {
          callback(500, {'Error': `Could not hash the user's password`});
        }

      } else {
        // User already exists
        callback(400,{'Error': 'User with phone number already exists'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// users get
// required data: phone
// optional data: none
handlers._users.get = (data, callback) => {
  // check that number provided is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    // get token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        // lookup user
        _data.read('users', phone, (err, data) => {
          if(!err && data) {
            // Remove hashed password from user object before returing to req
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing require field'});
  }
};

// users put
// required data: phone
// optional data: firstName, lastName, password(at least one must be specified)
handlers._users.put = (data, callback) => {
  // check required fields
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // check for optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // error if phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if(firstName || lastName || password) {

      // get token from headers
      const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, tokenIsValid => {
        if (tokenIsValid) {
          // look up user
          _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              // update fields
              if(firstName) {
                userData.firstName = firstName;
              }
              if(lastName) {
                userData.lastName = lastName;
              }
              if(password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store new updates
              _data.update('users', phone, userData, err => {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Could not update user'});
                }
              });
            } else {
              callback(400, {'Error': 'User does not exist'});
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token in header, or token is invalid'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// users delete
// required field: phone
//
// // TODO: cleanup any other data files associated with user
handlers._users.delete = (data, callback) => {
  // check that number provided is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    // get token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if(!err && data) {
            _data.delete('users', phone, err => {
              if (!err) {
                callback(200);
              } else {
                callback(500, {'Error': 'Could not delete specified user'});
              }
            });
          } else {
            callback(400, {'Error': 'Could not find user'});
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing require field'});
  }
};


// Tokens
handlers.tokens = (data, callback) => {

  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for tokens methods
handlers._tokens = {};

// tokens post
// required data: phone, password
// optional data: none
handlers._tokens.post = (data, callback) => {
  // check required fields
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // look up user with matched phone number
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // hash sent password and compare to user password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // if valid create new token with random name, set exp. date 1 hour in future
          const tokenId = helpers.createRandomString(20);

          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            'id': tokenId,
            expires,
          };

          // Store token
          _data.create('tokens', tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not craete new token'});
            }
          });
        } else {
          callback(400, {'Error': 'Password did not match specified user password'});
        }
      } else {
        callback(400, {'Error': 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }

};

// tokens get
// required data: id
// optional data: none
handlers._tokens.get = (data, callback) => {
  // check that id is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // look up token
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing require field'});
  }
};

// tokens put
// required data: id, extend
// optional _data: none
handlers._tokens.put = (data, callback) => {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
      // look up token
      _data.read('tokens', id, (err, tokenData) => {
        if(!err && tokenData) {
          // Check to make sure token isnt already expired
          if (tokenData.expires > Date.now()) {
            // set expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 60 * 60;

            // store new user token updates
            _data.update('tokens', id, tokenData, err => {
              if(!err) {
                callback(200);
              } else {
                callback(500,{'Error': 'Could not update token expiration'});
              }
            });
          } else {
            callback(400,{'Error': 'The token has already expired and cannot be extended'} );
          }
        } else {
          callback(400,{'Error': 'Token data does not exist'} );
        }
      });
    } else {
      callback(400, {'Error': 'Missing require field or fields are invalid'});
    }
};

// tokens delete
// required data: id
// optional data: none
handlers._tokens.delete = (data, callback) => {
  // check that id is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, (err, data) => {
      if(!err && data) {
        _data.delete('tokens', id, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete specified token'});
          }
        });
      } else {
        callback(400, {'Error': 'Could not find token'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing require field'});
  }
};

// verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  // lookup token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err) {
      // check that token is for given user and not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks

handlers.checks = (data, callback) => {

  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Checks container
handlers._checks = {};

// checks -post
// required data: protocol, url, method, successCodes, timeoutSeconds
// optional data: none
handlers._checks.post = (data, callback) => {
  // validate inputs
  const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if(protocol && url && method && successCodes && timeoutSeconds) {
    // get user token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Lookup user by reading token
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        // lookup user data
        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // verify user has less than max checks per user
            if (userChecks.length < config.maxChecks) {
              // create a random id for the check
              const checkId = helpers.createRandomString(20);

              // create the check object and include user phone
              const checkObject = {
                'id': checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds,
              };

              _data.create('checks', checkId, checkObject, err => {
                if (!err) {
                  // add the check id to the user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // save new user data
                  _data.update('users', userPhone, userData, err => {
                    if (!err) {
                      // return data about new check to requester
                      callback(200, checkObject);
                    } else {
                      callback(500, {'Error': 'Could not update user with new check'});
                    }
                  });
                } else {
                  callback(500, {'Error': 'Could not create new check'});
                }
              });

            } else {
              callback(400, {'Error': `User already has max number of checks (${config.maxChecks})`});
            }
          } else {
            callback(403);
          }
        });

      } else {
        callback(403);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required inputs or inputs are invalid'});
  }
};



// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
