const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

function adminAuth(req, res, next) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}

module.exports = adminAuth;
