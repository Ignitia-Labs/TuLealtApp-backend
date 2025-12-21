import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3.service';

/**
 * Módulo de almacenamiento
 * Proporciona servicios para almacenar archivos en S3 (MinIO)
 */
@Global()
@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class StorageModule {}
