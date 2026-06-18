import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface StandardError {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * Catches every unhandled exception and emits the standard Kaw Kaw error shape.
 * HttpExceptions keep their status/message; everything else becomes a 500 with a
 * generic message (the real error is logged, never leaked to the client).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      errorCode = HttpStatus[status] ?? 'ERROR';
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string) ?? exception.message;
        if (Array.isArray(body.message)) {
          // class-validator returns an array of messages
          details = body.message;
          message = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
        }
        if (body.error) errorCode = String(body.error).replace(/\s+/g, '_').toUpperCase();
      }
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    const body: StandardError = {
      statusCode: status,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as Request & { id?: string }).id,
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}: ${message}`);
    }

    response.status(status).json(body);
  }
}
