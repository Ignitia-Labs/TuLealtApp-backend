import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

/**
 * Filtro global para manejar excepciones HTTP
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private fileLogger?: FileLoggerService;

  constructor(fileLogger?: FileLoggerService) {
    this.fileLogger = fileLogger;
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extraer mensaje de error
    // Si es un objeto con mensajes de validación, usar esos mensajes
    let message: string | string[];
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if ('message' in exceptionResponse) {
        message = (exceptionResponse as any).message;
      } else if (Array.isArray(exceptionResponse)) {
        message = exceptionResponse;
      } else {
        message = exception.message;
      }
    } else {
      message = exception.message;
    }

    // Loggear errores HTTP (solo errores 5xx se registran en archivo en producción)
    if (status >= 500) {
      const messageStr = Array.isArray(message) ? message.join(', ') : message;
      if (this.fileLogger) {
        this.fileLogger.logHttpException(
          status,
          request.url,
          request.method,
          messageStr,
          exception.stack,
          request.body,
        );
      } else {
        // Fallback si el logger no está disponible
        console.error('[HttpExceptionFilter] Error HTTP:', {
          status,
          path: request.url,
          method: request.method,
          message,
          stack: exception.stack,
        });
      }
    }

    // Construir respuesta de error
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // Agregar campo 'error' si está presente en la respuesta de la excepción
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'error' in exceptionResponse
    ) {
      errorResponse.error = (exceptionResponse as any).error;
    }

    response.status(status).json(errorResponse);
  }
}

/**
 * Filtro global para manejar excepciones no controladas
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private fileLogger?: FileLoggerService;

  constructor(fileLogger?: FileLoggerService) {
    this.fileLogger = fileLogger;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    // Registrar excepción no controlada en archivo (producción) o consola (desarrollo)
    if (this.fileLogger) {
      this.fileLogger.logUnhandledException(exception, request.url, request.method, status);
    } else {
      // Fallback si el logger no está disponible
      console.error('========================================');
      console.error('[AllExceptionsFilter] Error capturado:');
      console.error('Path:', request.url);
      console.error('Method:', request.method);
      console.error('Status:', status);
      console.error('Message:', message);

      if (exception instanceof Error) {
        console.error('Error name:', exception.name);
        console.error('Error message:', exception.message);
        console.error('Error stack:', exception.stack);
      } else {
        console.error('Exception type:', typeof exception);
        console.error('Exception:', JSON.stringify(exception, null, 2));
      }
      console.error('========================================');
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
