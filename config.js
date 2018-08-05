// Create and export config var's


// Container for envs
const environments = {};

// Staging object (default)
environments.staging = {
  'port': 3000,
  'envName': 'staging'
};


// Prod object
environments.production = {
  'port': 5000,
  'envName': 'production'
};

// determine which evn was passed as a cli arg
const currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check that current env is defined, if not, default to staging
const environmentToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

// export module

module.exports = environmentToExport;
