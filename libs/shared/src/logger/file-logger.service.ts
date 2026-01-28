import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio para logging de errores a archivo
 * Solo registra errores en producción para tracking y análisis
 */
@Injectable()
export class FileLoggerService {
  private readonly logger = new Logger(FileLoggerService.name);
  private readonly logsDir: string;
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // Directorio de logs en la raíz del proyecto
    this.logsDir = path.join(process.cwd(), 'logs');

    // Crear directorio de logs si no existe
    this.ensureLogsDirectory();
  }

  /**
   * Asegura que el directorio de logs existe
   */
  private ensureLogsDirectory(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        this.logger.log(`Directorio de logs creado: ${this.logsDir}`);
      }
    } catch (error) {
      // Si no se puede crear el directorio, solo loguear en consola
      console.error(`Error al crear directorio de logs: ${error.message}`);
    }
  }

  /**
   * Obtiene el nombre del archivo de log para la fecha actual
   */
  private getLogFileName(): string {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    return `errors-${dateStr}.log`;
  }

  /**
   * Obtiene la ruta completa del archivo de log
   */
  private getLogFilePath(): string {
    return path.join(this.logsDir, this.getLogFileName());
  }

  /**
   * Formatea el mensaje de error para el log
   */
  private formatLogMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}\n`;
  }

  /**
   * Escribe un mensaje en el archivo de log
   */
  private writeToFile(level: string, message: string, context?: any): void {
    try {
      const logMessage = this.formatLogMessage(level, message, context);
      const logFilePath = this.getLogFilePath();

      // Escribir al archivo de forma asíncrona (no bloquea)
      fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
          // Si falla escribir al archivo, solo loguear en consola
          console.error(`Error al escribir en archivo de log: ${err.message}`);
        }
      });
    } catch (error) {
      // Si hay algún error, solo loguear en consola
      console.error(`Error en FileLoggerService: ${error.message}`);
    }
  }

  /**
   * Registra un error en el archivo de log
   * Solo funciona en producción, en desarrollo solo loguea en consola
   */
  error(message: string, context?: any): void {
    if (this.isProduction) {
      this.writeToFile('ERROR', message, context);
    } else {
      // En desarrollo, también mostrar en consola para debugging
      this.logger.error(message, context);
    }
  }

  /**
   * Registra un error fatal en el archivo de log
   */
  fatal(message: string, context?: any): void {
    if (this.isProduction) {
      this.writeToFile('FATAL', message, context);
    } else {
      this.logger.error(`[FATAL] ${message}`, context);
    }
  }

  /**
   * Registra una excepción HTTP en el archivo de log
   */
  logHttpException(
    status: number,
    path: string,
    method: string,
    message: string,
    stack?: string,
    requestBody?: any,
  ): void {
    if (this.isProduction) {
      const context = {
        type: 'HTTP_EXCEPTION',
        status,
        path,
        method,
        message,
        stack,
        requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
      };
      this.writeToFile('ERROR', `HTTP Exception: ${method} ${path} - ${message}`, context);
    } else {
      this.logger.error(`HTTP Exception: ${method} ${path} - ${message}`, {
        status,
        stack,
        requestBody,
      });
    }
  }

  /**
   * Registra una excepción no controlada en el archivo de log
   */
  logUnhandledException(exception: unknown, path: string, method: string, status: number): void {
    if (this.isProduction) {
      const context = {
        type: 'UNHANDLED_EXCEPTION',
        path,
        method,
        status,
        error:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : {
                type: typeof exception,
                value: JSON.stringify(exception),
              },
      };
      const message =
        exception instanceof Error
          ? `Unhandled Exception: ${exception.name} - ${exception.message}`
          : 'Unhandled Exception: Unknown error';
      this.writeToFile('FATAL', message, context);
    } else {
      this.logger.error('Unhandled Exception', {
        exception,
        path,
        method,
        status,
      });
    }
  }
}
