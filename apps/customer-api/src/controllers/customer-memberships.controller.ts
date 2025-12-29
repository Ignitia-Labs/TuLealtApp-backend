import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetCustomerMembershipsHandler,
  GetCustomerMembershipsRequest,
  GetCustomerMembershipsResponse,
  GetCustomerMembershipHandler,
  GetCustomerMembershipRequest,
  GetCustomerMembershipResponse,
} from '@libs/application';
import { ICustomerMembershipRepository } from '@libs/domain';
import {
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  MembershipOwnershipGuard,
  CurrentUser,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';
import { Inject, NotFoundException } from '@nestjs/common';

/**
 * Controlador de customer memberships para Customer API
 * Permite a los customers ver sus propias memberships
 *
 * Endpoints:
 * - GET /customer/memberships - Listar todas las memberships del usuario autenticado
 * - GET /customer/memberships/:id - Obtener membership específica del usuario autenticado
 * - GET /customer/memberships/qr/:qrCode - Buscar membership por QR code
 */
@ApiTags('Customer Memberships')
@Controller('customer/memberships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerMembershipsController {
  constructor(
    private readonly getCustomerMembershipsHandler: GetCustomerMembershipsHandler,
    private readonly getCustomerMembershipHandler: GetCustomerMembershipHandler,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar mis memberships',
    description:
      'Obtiene todas las memberships del usuario autenticado. Solo puede ver sus propias memberships.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    type: Number,
    description: 'ID del tenant para filtrar las memberships',
    example: 1,
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Si es true, solo retorna memberships activas',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de memberships obtenida exitosamente',
    type: GetCustomerMembershipsResponse,
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
  async getMyMemberships(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<GetCustomerMembershipsResponse> {
    const request = new GetCustomerMembershipsRequest();
    if (tenantId) {
      request.tenantId = parseInt(tenantId, 10);
    }
    if (activeOnly) {
      request.activeOnly = activeOnly === 'true';
    }
    return this.getCustomerMembershipsHandler.execute(request, user.userId, user.roles);
  }

  @Get('qr/:qrCode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Buscar membership por QR code',
    description:
      'Busca una membership por su QR code. Solo puede acceder a sus propias memberships.',
  })
  @ApiParam({
    name: 'qrCode',
    description: 'QR code de la membership',
    type: String,
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership encontrada',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a esta membership',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getMembershipByQrCode(
    @Param('qrCode') qrCode: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCustomerMembershipResponse> {
    const membership = await this.membershipRepository.findByQrCode(qrCode);
    if (!membership) {
      throw new NotFoundException(`Membership with QR code ${qrCode} not found`);
    }
    const request = new GetCustomerMembershipRequest();
    request.membershipId = membership.id;
    return this.getCustomerMembershipHandler.execute(request, user.userId, user.roles);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener mi membership por ID',
    description:
      'Obtiene una membership específica del usuario autenticado por su ID. Solo puede acceder a sus propias memberships.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership encontrada',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a esta membership',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'You can only access your own memberships',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getMyMembership(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCustomerMembershipResponse> {
    const request = new GetCustomerMembershipRequest();
    request.membershipId = id;
    return this.getCustomerMembershipHandler.execute(request, user.userId, user.roles);
  }
}

