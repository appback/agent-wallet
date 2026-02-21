const { AppError } = require('../errors');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    console.error(`[${err.code}] ${err.message}`);
  } else {
    console.error('[INTERNAL_ERROR]', err.stack || err);
  }

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Internal server error'
  });
}

module.exports = errorHandler;
