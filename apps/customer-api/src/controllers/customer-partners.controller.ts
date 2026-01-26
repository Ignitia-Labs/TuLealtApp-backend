import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  GetCustomerPartnersHandler,
  GetCustomerPartnersRequest,
  GetCustomerPartnersResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  CurrentUser,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de customer partners para Customer API
 * Permite a los customers ver sus asociaciones con partners
 *
 * Nota: Las asociaciones ahora se gestionan a través de customer_memberships.
 * Para crear una membership, usar POST /customer/memberships o que el partner
 * cree la membership desde su API.
 *
 * Endpoints:
 * - GET /customer/partners - Listar todos los partners del usuario autenticado
 */
@ApiTags('Customer Partners')
@Controller('partners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerPartnersController {
  constructor(private readonly getCustomerPartnersHandler: GetCustomerPartnersHandler) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar mis partners',
    description:
      'Obtiene todos los partners asociados al usuario autenticado a través de sus memberships. ' +
      'Solo puede ver sus propias asociaciones. Los datos provienen de customer_memberships.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['active', 'inactive'],
    description: 'Filtrar por status de la membership (active/inactive)',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de partners obtenida exitosamente',
    type: GetCustomerPartnersResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getMyPartners(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ): Promise<GetCustomerPartnersResponse> {
    const request = new GetCustomerPartnersRequest();
    request.userId = user.userId;
    if (status && (status === 'active' || status === 'inactive')) {
      request.status = status;
    }
    return this.getCustomerPartnersHandler.execute(request);
  }
}
