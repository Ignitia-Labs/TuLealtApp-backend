import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ImageOptimizerService } from './image-optimizer.service';

/**
 * Módulo de almacenamiento
 * Proporciona servicios para almacenar archivos en S3 (MinIO) y optimizar imágenes
 */
@Global()
@Module({
  providers: [S3Service, ImageOptimizerService],
  exports: [S3Service, ImageOptimizerService],
})
export class StorageModule {}
