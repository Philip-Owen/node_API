// Request Handlers

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');


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
//
// @TODO only let authed user access their object.
//
handlers._users.get = (data, callback) => {
  // check that number provided is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
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
    callback(400, {'Error': 'Missing require field'});
  }
};

// users put
handlers._users.put = (data, callback) => {

};

// users delete
handlers._users.delete = (data, callback) => {

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
