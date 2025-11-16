import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}

export const ResponseUtils = {
  // Success response
  success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    };
    return res.status(statusCode).json(response);
  },

  // Error response
  error(res: Response, error: string, statusCode: number = 400): Response {
    const response: ApiResponse = {
      success: false,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
      },
    };
    return res.status(statusCode).json(response);
  },

  // Not found response
  notFound(res: Response, resource: string = 'Resource'): Response {
    return this.error(res, `${resource} not found`, 404);
  },

  // Unauthorized response
  unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, 401);
  },

  // Forbidden response
  forbidden(res: Response, message: string = 'Access forbidden'): Response {
    return this.error(res, message, 403);
  },

  // Validation error response
  validationError(res: Response, errors: string[]): Response {
    return this.error(res, `Validation failed: ${errors.join(', ')}`, 422);
  },

  // Internal server error
  serverError(
    res: Response,
    message: string = 'Internal server error'
  ): Response {
    return this.error(res, message, 500);
  },

  // Paginated response
  paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
    return res.status(200).json(response);
  },
};
