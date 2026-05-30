export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: this.message,
      ...(this.code ? { code: this.code } : {}),
    };
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado. Inicia sesión para continuar.") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string = "Recurso") {
    super(`${entity} no encontrado`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.fields ? { fields: this.fields } : {}),
    };
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Demasiadas solicitudes. Intenta de nuevo en un minuto.", 429, "RATE_LIMITED");
    this.name = "RateLimitError";
  }
}
