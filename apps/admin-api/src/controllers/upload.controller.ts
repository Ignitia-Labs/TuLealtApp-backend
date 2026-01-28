import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { S3Service } from '@libs/infrastructure';
import {
  UpdatePartnerHandler,
  UpdatePartnerRequest,
  UpdatePartnerResponse,
  UpdateTenantHandler,
  UpdateTenantRequest,
  UpdateTenantResponse,
} from '@libs/application';
import { IPartnerRepository, ITenantRepository } from '@libs/domain';
import { Inject } from '@nestjs/common';
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
 * Permite subir imágenes que se almacenan en S3 (MinIO) y actualizar los registros en la base de datos
 *
 * Endpoints:
 * - POST /admin/upload/partner/:id/logo - Subir logo de partner y actualizar en BD
 * - POST /admin/upload/partner/:id/banner - Subir banner de partner y actualizar en BD
 * - POST /admin/upload/tenant/:id/logo - Subir logo de tenant y actualizar en BD
 */
@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly updatePartnerHandler: UpdatePartnerHandler,
    private readonly updateTenantHandler: UpdateTenantHandler,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  @Post('partner/:id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir logo de partner',
    description:
      'Sube una imagen que se almacenará en S3, actualiza el partner en la base de datos y retorna la URL pública y el partner actualizado. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del partner',
    example: 1,
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
    description: 'Logo subido y actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/partners/abc123-logo.png',
          description: 'URL pública del logo subido',
        },
        partner: {
          type: 'object',
          description: 'Partner actualizado con el nuevo logo',
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
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
  })
  async uploadPartnerLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: MulterFile,
  ): Promise<{ url: string; partner: UpdatePartnerResponse }> {
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

    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(id);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    try {
      // Obtener logo anterior si existe para eliminarlo después
      const oldLogoUrl = partner.logo;

      // Subir nuevo logo a S3
      const url = await this.s3Service.uploadFile(file, 'partners');

      // Actualizar partner con el nuevo logo
      const updateRequest = new UpdatePartnerRequest();
      updateRequest.logo = url;
      const updatedPartner = await this.updatePartnerHandler.execute(id, updateRequest);

      // Eliminar logo anterior de S3 si existe
      if (oldLogoUrl) {
        try {
          const oldLogoKey = this.s3Service.extractKeyFromUrl(oldLogoUrl);
          await this.s3Service.deleteFile(oldLogoKey);
        } catch (error) {
          // Log el error pero no fallar la operación si no se puede eliminar el logo anterior
          console.warn(`Failed to delete old logo: ${error.message}`);
        }
      }

      return { url, partner: updatedPartner };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Post('partner/:id/banner')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir banner de partner',
    description:
      'Sube una imagen de banner que se almacenará en S3, actualiza el partner en la base de datos y retorna la URL pública y el partner actualizado. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del partner',
    example: 1,
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
    description: 'Banner subido y actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/partners/abc123-banner.png',
          description: 'URL pública del banner subido',
        },
        partner: {
          type: 'object',
          description: 'Partner actualizado con el nuevo banner',
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
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
  })
  async uploadPartnerBanner(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: MulterFile,
  ): Promise<{ url: string; partner: UpdatePartnerResponse }> {
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

    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(id);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    try {
      // Obtener banner anterior si existe para eliminarlo después
      const oldBannerUrl = partner.banner;

      // Subir nuevo banner a S3
      const url = await this.s3Service.uploadFile(file, 'partners', 'banner');

      // Actualizar partner con el nuevo banner
      const updateRequest = new UpdatePartnerRequest();
      updateRequest.banner = url;
      const updatedPartner = await this.updatePartnerHandler.execute(id, updateRequest);

      // Eliminar banner anterior de S3 si existe
      if (oldBannerUrl) {
        try {
          const oldBannerKey = this.s3Service.extractKeyFromUrl(oldBannerUrl);
          await this.s3Service.deleteFile(oldBannerKey);
        } catch (error) {
          // Log el error pero no fallar la operación si no se puede eliminar el banner anterior
          console.warn(`Failed to delete old banner: ${error.message}`);
        }
      }

      return { url, partner: updatedPartner };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Post('tenant/:id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir logo de tenant',
    description:
      'Sube una imagen que se almacenará en S3, actualiza el tenant en la base de datos y retorna la URL pública y el tenant actualizado. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
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
    description: 'Logo subido y actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/tenants/xyz789-logo.png',
          description: 'URL pública del logo subido',
        },
        tenant: {
          type: 'object',
          description: 'Tenant actualizado con el nuevo logo',
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
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
  })
  async uploadTenantLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: MulterFile,
  ): Promise<{ url: string; tenant: UpdateTenantResponse }> {
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

    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    try {
      // Obtener logo anterior si existe para eliminarlo después
      const oldLogoUrl = tenant.logo;

      // Subir nuevo logo a S3
      const url = await this.s3Service.uploadFile(file, 'tenants');

      // Actualizar tenant con el nuevo logo
      const updateRequest = new UpdateTenantRequest();
      updateRequest.logo = url;
      const updatedTenant = await this.updateTenantHandler.execute(id, updateRequest);

      // Eliminar logo anterior de S3 si existe
      if (oldLogoUrl) {
        try {
          const oldLogoKey = this.s3Service.extractKeyFromUrl(oldLogoUrl);
          await this.s3Service.deleteFile(oldLogoKey);
        } catch (error) {
          // Log el error pero no fallar la operación si no se puede eliminar el logo anterior
          console.warn(`Failed to delete old logo: ${error.message}`);
        }
      }

      return { url, tenant: updatedTenant };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
