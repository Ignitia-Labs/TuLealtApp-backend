import { Module, Global } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';

/**
 * Módulo global de logging
 * Proporciona servicios de logging a archivo para toda la aplicación
 */
@Global()
@Module({
  providers: [FileLoggerService],
  exports: [FileLoggerService],
})
export class LoggerModule {}
