// Lib for storing and rotating logs

// dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Logs container
const lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

// append a string to a file. create the file if it does not exist.
lib.append = (file, str, callback) => {
  // open file for appending
  fs.open(lib.baseDir+file+'.log', 'a', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // append file and close it
      fs.appendFile(fileDescriptor, str+'\n', err => {
        if (!err) {
          fs.close(fileDescriptor, err => {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing file that was being appended');
            }
          });
        } else {
          callback('Error appending to file');
        }
      });
    } else {
      callback('Could not open file for appending');
    }
  });
};

module.exports = lib;
