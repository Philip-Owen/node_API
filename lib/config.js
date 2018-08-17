// Create and export config var's


// Container for envs
const environments = {};

// Staging object (default)
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret',
  'maxChecks': 5,
};


// Prod object
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoSecret',
  'maxChecks': 5,
};

// determine which evn was passed as a cli arg
const currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check that current env is defined, if not, default to staging
const environmentToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

// export module

module.exports = environmentToExport;
