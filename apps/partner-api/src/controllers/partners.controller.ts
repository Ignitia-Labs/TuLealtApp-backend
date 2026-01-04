import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetPartnerWithTenantsAndBranchesHandler,
  GetPartnerWithTenantsAndBranchesRequest,
  GetPartnerWithTenantsAndBranchesResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository } from '@libs/domain';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de partners para Partner API
 * Permite obtener información del partner autenticado con sus tenants y branches
 *
 * Endpoints:
 * - GET /partner/partners/me - Obtener información del partner autenticado con tenants y branches
 */
@ApiTags('Partner')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly getPartnerWithTenantsAndBranchesHandler: GetPartnerWithTenantsAndBranchesHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTNER', 'PARTNER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener información del partner autenticado',
    description:
      'Obtiene la información completa del partner del usuario autenticado, incluyendo todos sus tenants y las branches de cada tenant. El usuario debe tener rol PARTNER o PARTNER_STAFF y pertenecer a un partner.',
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
      rewardType: 'points',
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
              status: 'active',
              createdAt: '2024-01-10T00:00:00.000Z',
              updatedAt: '2024-01-10T00:00:00.000Z',
            },
          ],
        },
      ],
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
}

