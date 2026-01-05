import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  GetPartnerCustomersHandler,
  GetPartnerCustomersRequest,
  GetPartnerCustomersResponse,
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
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de partner customers para Partner API
 * Permite a los partners ver sus customers asociados
 *
 * Endpoints:
 * - GET /partner/customers - Listar todos los customers del partner autenticado (con paginación)
 */
@ApiTags('Partner Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
export class PartnerCustomersController {
  constructor(
    private readonly getPartnerCustomersHandler: GetPartnerCustomersHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar customers del partner',
    description:
      'Obtiene todos los customers asociados al partner del usuario autenticado. Incluye paginación para manejar grandes volúmenes de datos. El usuario debe tener rol PARTNER o PARTNER_STAFF y pertenecer a un partner.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página (por defecto 50, máximo 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    description: 'Filtrar por status de la asociación',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de customers obtenida exitosamente',
    type: GetPartnerCustomersResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a este recurso',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async getMyCustomers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ): Promise<GetPartnerCustomersResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    const request = new GetPartnerCustomersRequest();
    request.partnerId = currentUser.partnerId;
    if (page) {
      request.page = parseInt(page, 10);
    }
    if (limit) {
      request.limit = parseInt(limit, 10);
    }
    if (status) {
      request.status = status as 'active' | 'inactive' | 'suspended';
    }

    return this.getPartnerCustomersHandler.execute(request);
  }
}
