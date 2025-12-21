import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { S3Service } from '@libs/infrastructure';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

// Tipo para archivos subidos con Multer (compatible con Express.Multer.File)
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
  stream?: NodeJS.ReadableStream;
};

/**
 * Controlador para subir archivos (imágenes)
 * Permite subir imágenes que se almacenan en S3 (MinIO)
 *
 * Endpoints:
 * - POST /admin/upload/partner-logo - Subir logo de partner
 * - POST /admin/upload/tenant-logo - Subir logo de tenant
 */
@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('partner-logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir logo de partner',
    description:
      'Sube una imagen que se almacenará en S3 y retorna la URL pública. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, webp)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/partners/abc123-logo.png',
          description: 'URL pública del logo subido',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o formato no permitido',
    example: {
      statusCode: 400,
      message: 'Invalid file format. Only jpg, jpeg, png, webp are allowed',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
  })
  async uploadPartnerLogo(@UploadedFile() file?: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format. Only jpg, jpeg, png, webp are allowed');
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      const url = await this.s3Service.uploadFile(file, 'partners');
      return { url };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Post('tenant-logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir logo de tenant',
    description:
      'Sube una imagen que se almacenará en S3 y retorna la URL pública. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, webp)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/tenants/xyz789-logo.png',
          description: 'URL pública del logo subido',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o formato no permitido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de administrador',
  })
  async uploadTenantLogo(@UploadedFile() file?: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format. Only jpg, jpeg, png, webp are allowed');
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      const url = await this.s3Service.uploadFile(file, 'tenants');
      return { url };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
