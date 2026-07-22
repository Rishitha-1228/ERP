export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new AppError(404, message);
  }
  static conflict(message: string, details?: unknown) {
    return new AppError(409, message, details);
  }
}
