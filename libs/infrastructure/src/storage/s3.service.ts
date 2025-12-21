import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as path from 'path';
import { UploadedFile } from './types/file.interface';

/**
 * Servicio para interactuar con almacenamiento S3 (MinIO)
 * Proporciona métodos para subir, obtener y eliminar archivos
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'tulealtapp-images';

    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || true,
    });

    this.logger.log(`S3Service initialized with bucket: ${this.bucketName}`);
  }

  /**
   * Sube un archivo a S3
   * @param file Buffer del archivo
   * @param folder Carpeta donde se almacenará (ej: 'partners', 'tenants')
   * @param originalName Nombre original del archivo
   * @returns URL pública del archivo subido
   */
  async uploadFile(file: UploadedFile, folder: string, originalName?: string): Promise<string> {
    try {
      // Generar nombre único para el archivo
      const fileExtension = path.extname(file.originalname);
      const fileName = originalName || `${crypto.randomUUID()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      // Subir archivo a S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Para MinIO, esto puede no funcionar, pero no causa error
      });

      await this.s3Client.send(command);

      // Construir URL pública
      const publicUrl = this.getPublicUrl(key);

      this.logger.log(`File uploaded successfully: ${key}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Obtiene una URL firmada temporal para acceder a un archivo
   * @param key Clave del archivo en S3
   * @param expiresIn Tiempo de expiración en segundos (default: 1 hora)
   * @returns URL firmada temporal
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo de S3
   * @param key Clave del archivo en S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Extrae la clave del archivo desde una URL pública
   * @param url URL pública del archivo
   * @returns Clave del archivo en S3
   */
  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remover el bucket name y el primer slash
      const pathParts = urlObj.pathname.split('/');
      // En MinIO con path-style, la estructura es /bucket/key
      // En virtual-hosted style sería bucket.s3.endpoint/key
      if (pathParts.length > 2) {
        return pathParts.slice(2).join('/');
      }
      return pathParts[pathParts.length - 1];
    } catch (error) {
      this.logger.warn(`Could not extract key from URL: ${url}`);
      return url;
    }
  }

  /**
   * Construye la URL pública de un archivo
   * @param key Clave del archivo en S3
   * @returns URL pública
   */
  private getPublicUrl(key: string): string {
    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    // Para MinIO con path-style: http://endpoint/bucket/key
    return `${endpoint}/${this.bucketName}/${key}`;
  }

  /**
   * Valida que el bucket exista, si no existe lo crea
   * Este método debería llamarse al iniciar la aplicación
   */
  async ensureBucketExists(): Promise<void> {
    try {
      // Intentar inicializar el bucket usando el script de inicialización
      const { initializeS3Bucket } = await import('./s3-init');
      await initializeS3Bucket();
      this.logger.log(`Bucket '${this.bucketName}' is ready`);
    } catch (error) {
      this.logger.warn(
        `Could not ensure bucket exists: ${error.message}. Make sure bucket '${this.bucketName}' exists in MinIO. You can create it via MinIO Console at http://localhost:9001`,
      );
    }
  }
}
