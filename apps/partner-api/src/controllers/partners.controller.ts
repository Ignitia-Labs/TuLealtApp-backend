import {
  Controller,
  Get,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  GetPartnerWithTenantsAndBranchesHandler,
  GetPartnerWithTenantsAndBranchesRequest,
  GetPartnerWithTenantsAndBranchesResponse,
  UpdatePartnerHandler,
  UpdatePartnerRequest,
  UpdatePartnerResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, IPartnerRepository } from '@libs/domain';
import { S3Service } from '@libs/infrastructure';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
} from '@libs/shared';

// Tipo para archivos subidos con Multer
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
 * Controlador de partners para Partner API
 * Permite obtener información del partner autenticado con sus tenants y branches
 * Permite gestionar el banner del partner autenticado
 *
 * Endpoints:
 * - GET /partner/partners/me - Obtener información del partner autenticado con tenants y branches
 * - POST /partner/partners/banner - Subir banner del partner autenticado
 * - DELETE /partner/partners/banner - Eliminar banner del partner autenticado
 */
@ApiTags('Partner')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly getPartnerWithTenantsAndBranchesHandler: GetPartnerWithTenantsAndBranchesHandler,
    private readonly updatePartnerHandler: UpdatePartnerHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    private readonly s3Service: S3Service,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener información del partner autenticado',
    description:
      'Obtiene la información completa del partner del usuario autenticado, incluyendo todos sus tenants, las branches de cada tenant y los límites del partner. El usuario debe tener rol PARTNER o PARTNER_STAFF y pertenecer a un partner.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del partner obtenida exitosamente',
    type: GetPartnerWithTenantsAndBranchesResponse,
    example: {
      id: 1,
      name: 'Grupo Comercial ABC',
      responsibleName: 'María González',
      email: 'maria@abc-comercial.com',
      phone: '+502 2345-6789',
      countryId: 1,
      city: 'Ciudad de Guatemala',
      plan: 'conecta',
      logo: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
      category: 'Retail',
      branchesNumber: 5,
      website: 'https://abc-comercial.com',
      socialMedia: '@abccomercial',
      currencyId: 1,
      businessName: 'Grupo Comercial ABC S.A.',
      taxId: '12345678-9',
      fiscalAddress: 'Calle Principal 123, Zona 1, Ciudad de Guatemala',
      paymentMethod: 'credit_card',
      billingEmail: 'billing@abc-comercial.com',
      domain: 'abc-comercial.gt',
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z',
      tenants: [
        {
          tenant: {
            id: 1,
            partnerId: 1,
            name: 'Café Delicia',
            description: 'Cafetería gourmet con sabor artesanal',
            logo: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
            category: 'Cafeterías',
            currencyId: 'currency-8',
            primaryColor: '#ec4899',
            secondaryColor: '#fbbf24',
            pointsExpireDays: 365,
            minPointsToRedeem: 100,
            quickSearchCode: 'TENANT-ABC234',
            status: 'active',
            createdAt: '2024-01-05T00:00:00.000Z',
            updatedAt: '2024-01-05T00:00:00.000Z',
            qrScanning: true,
            offlineMode: true,
            referralProgram: true,
            birthdayRewards: true,
          },
          branches: [
            {
              id: 1,
              tenantId: 1,
              name: 'Café Delicia - Centro',
              address: 'Calle Principal 123, Zona 1',
              city: 'Guatemala City',
              country: 'Guatemala',
              phone: '+502 1234-5678',
              email: 'centro@cafedelicia.com',
              quickSearchCode: 'BRANCH-ABC234',
              status: 'active',
              createdAt: '2024-01-05T00:00:00.000Z',
              updatedAt: '2024-01-05T00:00:00.000Z',
            },
            {
              id: 2,
              tenantId: 1,
              name: 'Café Delicia - Zona 10',
              address: 'Avenida Reforma 456, Zona 10',
              city: 'Guatemala City',
              country: 'Guatemala',
              phone: '+502 2345-6789',
              email: 'zona10@cafedelicia.com',
              quickSearchCode: 'BRANCH-XYZ789',
              status: 'active',
              createdAt: '2024-01-10T00:00:00.000Z',
              updatedAt: '2024-01-10T00:00:00.000Z',
            },
          ],
        },
      ],
      limits: {
        maxTenants: 5,
        maxBranches: 20,
        maxCustomers: 5000,
        maxRewards: 50,
      },
      usage: {
        tenantsCount: 2,
        branchesCount: 8,
        customersCount: 2345,
        rewardsCount: 15,
        loyaltyProgramsCount: 3,
        loyaltyProgramsBaseCount: 1,
        loyaltyProgramsPromoCount: 1,
        loyaltyProgramsPartnerCount: 0,
        loyaltyProgramsSubscriptionCount: 1,
        loyaltyProgramsExperimentalCount: 0,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos de partner',
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getPartnerInfo(
    @CurrentUser() user: JwtPayload,
  ): Promise<GetPartnerWithTenantsAndBranchesResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerWithTenantsAndBranchesRequest();
    request.partnerId = userEntity.partnerId;

    return this.getPartnerWithTenantsAndBranchesHandler.execute(request);
  }

  @Post('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER', 'ADMIN_STAFF')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Subir banner del partner',
    description:
      'Sube una imagen de banner que se almacenará en S3 y actualiza el partner autenticado con la URL del banner. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB. Los usuarios PARTNER solo pueden modificar su propio banner.',
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
    description: 'Banner subido exitosamente',
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
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'Invalid file format. Only jpg, jpeg, png, webp are allowed',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async uploadPartnerBanner(
    @UploadedFile() file?: MulterFile,
    @CurrentUser() user?: JwtPayload,
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

    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const partnerId = userEntity.partnerId;

    // Validar ownership del partner (excepto para ADMIN/ADMIN_STAFF)
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ADMIN_STAFF');
    if (!isAdmin) {
      // Para PARTNER/PARTNER_STAFF, solo pueden modificar su propio partner
      if (userEntity.partnerId !== partnerId) {
        throw new ForbiddenException('You can only upload banners for your own partner');
      }
    }

    // Obtener el partner para validar que existe y obtener el banner anterior
    const partner = await this.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${partnerId} not found`);
    }

    try {
      // Obtener banner anterior si existe para eliminarlo después
      const oldBannerUrl = partner.banner;

      // Subir nuevo banner a S3
      const url = await this.s3Service.uploadFile(file, 'partners', 'banner');

      // Actualizar partner con el nuevo banner
      const updateRequest = new UpdatePartnerRequest();
      updateRequest.banner = url;
      const updatedPartner = await this.updatePartnerHandler.execute(partnerId, updateRequest);

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

  @Delete('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER', 'ADMIN_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar banner del partner',
    description:
      'Elimina el banner del partner autenticado (tanto de S3 como de la base de datos). Los usuarios PARTNER solo pueden eliminar el banner de su propio partner.',
  })
  @ApiResponse({
    status: 200,
    description: 'Banner eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Banner deleted successfully',
        },
        partner: {
          type: 'object',
          description: 'Partner actualizado sin banner',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado o sin banner',
    type: NotFoundErrorResponseDto,
  })
  async deletePartnerBanner(
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ message: string; partner: UpdatePartnerResponse }> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const partnerId = userEntity.partnerId;

    // Validar ownership del partner (excepto para ADMIN/ADMIN_STAFF)
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ADMIN_STAFF');
    if (!isAdmin) {
      // Para PARTNER/PARTNER_STAFF, solo pueden modificar su propio partner
      if (userEntity.partnerId !== partnerId) {
        throw new ForbiddenException('You can only delete banners for your own partner');
      }
    }

    // Obtener el partner para validar que existe y obtener el banner
    const partner = await this.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${partnerId} not found`);
    }

    if (!partner.banner) {
      throw new NotFoundException('Partner does not have a banner');
    }

    try {
      // Eliminar banner de S3
      const bannerKey = this.s3Service.extractKeyFromUrl(partner.banner);
      await this.s3Service.deleteFile(bannerKey);

      // Actualizar partner eliminando el banner
      const updateRequest = new UpdatePartnerRequest();
      updateRequest.banner = null;
      const updatedPartner = await this.updatePartnerHandler.execute(partnerId, updateRequest);

      return {
        message: 'Banner deleted successfully',
        partner: updatedPartner,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete banner: ${error.message}`);
    }
  }
}
