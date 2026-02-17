class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class InsufficientFundsError extends AppError {
  constructor(message = 'Insufficient funds') {
    super(message, 422, 'INSUFFICIENT_FUNDS');
  }
}

class DailyLimitExceededError extends AppError {
  constructor(message = 'Daily credit limit exceeded') {
    super(message, 429, 'DAILY_LIMIT_EXCEEDED');
  }
}

module.exports = {
  AppError, NotFoundError, UnauthorizedError, ForbiddenError,
  BadRequestError, ConflictError, InsufficientFundsError, DailyLimitExceededError
};
