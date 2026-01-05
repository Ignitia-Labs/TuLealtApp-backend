import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AssociateCustomerToPartnerHandler,
  AssociateCustomerToPartnerRequest,
  AssociateCustomerToPartnerResponse,
  GetCustomerPartnersHandler,
  GetCustomerPartnersRequest,
  GetCustomerPartnersResponse,
  UpdateCustomerPartnerStatusHandler,
  UpdateCustomerPartnerStatusRequest,
  UpdateCustomerPartnerStatusResponse,
  DissociateCustomerFromPartnerHandler,
  DissociateCustomerFromPartnerRequest,
  DissociateCustomerFromPartnerResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
  CurrentUser,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de customer partners para Customer API
 * Permite a los customers ver y gestionar sus asociaciones con partners
 *
 * Endpoints:
 * - GET /customer/partners - Listar todos los partners del usuario autenticado
 * - POST /customer/partners - Asociar el usuario autenticado a un partner
 */
@ApiTags('Customer Partners')
@Controller('customer/partners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerPartnersController {
  constructor(
    private readonly getCustomerPartnersHandler: GetCustomerPartnersHandler,
    private readonly associateCustomerToPartnerHandler: AssociateCustomerToPartnerHandler,
    private readonly updateCustomerPartnerStatusHandler: UpdateCustomerPartnerStatusHandler,
    private readonly dissociateCustomerFromPartnerHandler: DissociateCustomerFromPartnerHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar mis partners',
    description:
      'Obtiene todos los partners asociados al usuario autenticado. Solo puede ver sus propias asociaciones.',
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
    if (status) {
      request.status = status as 'active' | 'inactive' | 'suspended';
    }
    return this.getCustomerPartnersHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asociarme a un partner',
    description:
      'Asocia el usuario autenticado a un partner específico. Requiere tenantId y registrationBranchId.',
  })
  @ApiResponse({
    status: 201,
    description: 'Asociación creada exitosamente',
    type: AssociateCustomerToPartnerResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o conflicto',
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
  async associateToPartner(
    @CurrentUser() user: JwtPayload,
    @Body() body: Omit<AssociateCustomerToPartnerRequest, 'userId'>,
  ): Promise<AssociateCustomerToPartnerResponse> {
    const request = new AssociateCustomerToPartnerRequest();
    request.userId = user.userId;
    request.partnerId = body.partnerId;
    request.tenantId = body.tenantId;
    request.registrationBranchId = body.registrationBranchId;
    request.metadata = body.metadata;
    return this.associateCustomerToPartnerHandler.execute(request);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar status de mi asociación con un partner',
    description:
      'Actualiza el status de una asociación específica del usuario autenticado con un partner.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la asociación customer-partner',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Status actualizado exitosamente',
    type: UpdateCustomerPartnerStatusResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asociación no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() body: { status: 'active' | 'inactive' | 'suspended' },
  ): Promise<UpdateCustomerPartnerStatusResponse> {
    const request = new UpdateCustomerPartnerStatusRequest();
    request.associationId = id;
    request.status = body.status;
    return this.updateCustomerPartnerStatusHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desasociarme de un partner',
    description:
      'Desasocia el usuario autenticado de un partner específico. Realiza soft delete (desactiva la asociación).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la asociación customer-partner',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Desasociación exitosa',
    type: DissociateCustomerFromPartnerResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Asociación no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async dissociateFromPartner(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DissociateCustomerFromPartnerResponse> {
    const request = new DissociateCustomerFromPartnerRequest();
    request.associationId = id;
    return this.dissociateCustomerFromPartnerHandler.execute(request);
  }
}
