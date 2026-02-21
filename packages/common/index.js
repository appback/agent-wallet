const errors = require('./errors');
const token = require('./token');
const pagination = require('./pagination');
const errorHandler = require('./middleware/errorHandler');
const adminAuth = require('./middleware/adminAuth');

module.exports = {
  ...errors,
  ...token,
  ...pagination,
  errorHandler,
  adminAuth
};
