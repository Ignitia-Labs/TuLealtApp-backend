import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global para manejar excepciones HTTP
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Loggear errores HTTP para debugging (excepto 404 que son comunes)
    if (status >= 500) {
      console.error('[HttpExceptionFilter] Error HTTP:', {
        status,
        path: request.url,
        method: request.method,
        message: exception.message,
        stack: exception.stack,
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}

/**
 * Filtro global para manejar excepciones no controladas
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    // Loggear el error completo para debugging
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

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
