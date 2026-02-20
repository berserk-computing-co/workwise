import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | object[] = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        error = (resp.error as string) ?? HttpStatus[statusCode] ?? 'Error';

        // Handle class-validator validation errors
        if (Array.isArray(resp.message)) {
          // Transform ValidationPipe errors into field-level format
          const validationMessages = resp.message as string[];
          // class-validator returns messages like "firstName must be a string"
          // We'll pass them through — the field extraction is best-effort
          message = validationMessages.map((msg: string) => {
            const parts = msg.split(' ');
            const field = parts[0];
            return { field, message: msg };
          });
          error = 'Validation Error';
          statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
        } else {
          message = (resp.message as string) ?? exception.message;
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
    });
  }
}
