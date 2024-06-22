import dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV || 'development';

let config;

switch (env) {
  case 'production':
    config = require('./production').default;
    break;
  case 'development':
  default:
    config = require('./development').default;
    break;
}

export default config;
