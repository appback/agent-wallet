class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message
    };
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message || 'Validation failed', 400, 'VALIDATION_ERROR');
    this.details = details || null;
  }

  toJSON() {
    const json = super.toJSON();
    if (this.details) {
      json.details = this.details;
    }
    return json;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || 'Authentication required', 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Insufficient permissions', 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || 'Resource conflict', 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message || 'Too many requests', 429, 'RATE_LIMIT');
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message || 'Bad request', 400, 'BAD_REQUEST');
  }
}

class InsufficientFundsError extends AppError {
  constructor(message) {
    super(message || 'Insufficient funds', 422, 'INSUFFICIENT_FUNDS');
  }
}

class DailyLimitExceededError extends AppError {
  constructor(message) {
    super(message || 'Daily credit limit exceeded', 429, 'DAILY_LIMIT_EXCEEDED');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  BadRequestError,
  InsufficientFundsError,
  DailyLimitExceededError
};
