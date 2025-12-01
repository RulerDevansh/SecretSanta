const dotenv = require('dotenv');
const serverless = require('serverless-http');

// Load env variables for Vercel serverless
dotenv.config();

const createApp = require('../src/app');

let handler;

module.exports = (req, res) => {
  try {
    if (!handler) {
      const app = createApp();
      handler = serverless(app);
    }
    return handler(req, res);
  } catch (err) {
    console.error('Serverless handler error', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};
