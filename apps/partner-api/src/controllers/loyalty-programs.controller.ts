import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
  GetLoyaltyProgramsHandler,
  GetLoyaltyProgramsRequest,
  GetLoyaltyProgramsResponse,
  GetLoyaltyProgramHandler,
  GetLoyaltyProgramRequest,
  GetLoyaltyProgramResponse,
  CreateLoyaltyProgramHandler,
  CreateLoyaltyProgramRequest,
  CreateLoyaltyProgramResponse,
  UpdateLoyaltyProgramHandler,
  UpdateLoyaltyProgramRequest,
  UpdateLoyaltyProgramResponse,
  DeleteLoyaltyProgramHandler,
  DeleteLoyaltyProgramRequest,
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  PartnerResourceGuard,
  Roles,
  CurrentUser,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de programas de lealtad para Partner API
 * Permite gestionar programas de lealtad de los tenants del partner autenticado
 */
@ApiTags('Loyalty Programs')
@Controller('tenants/:tenantId/loyalty-programs')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class LoyaltyProgramsController {
  constructor(
    private readonly getLoyaltyProgramsHandler: GetLoyaltyProgramsHandler,
    private readonly getLoyaltyProgramHandler: GetLoyaltyProgramHandler,
    private readonly createLoyaltyProgramHandler: CreateLoyaltyProgramHandler,
    private readonly updateLoyaltyProgramHandler: UpdateLoyaltyProgramHandler,
    private readonly deleteLoyaltyProgramHandler: DeleteLoyaltyProgramHandler,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar programas de lealtad de un tenant',
    description: 'Obtiene todos los programas de lealtad de un tenant con filtros opcionales',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'programType',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL', 'all'],
    required: false,
    description: 'Filtrar por tipo de programa',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de programas de lealtad',
    type: GetLoyaltyProgramsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado', type: NotFoundErrorResponseDto })
  async getLoyaltyPrograms(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('programType')
    programType?: 'BASE' | 'PROMO' | 'PARTNER' | 'SUBSCRIPTION' | 'EXPERIMENTAL' | 'all',
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetLoyaltyProgramsResponse> {
    const request = new GetLoyaltyProgramsRequest();
    request.tenantId = tenantId;
    request.status = status || 'all';
    request.programType = programType || 'all';

    return this.getLoyaltyProgramsHandler.execute(request);
  }

  @Get(':programId')
  @ApiOperation({
    summary: 'Obtener programa de lealtad por ID',
    description:
      'Obtiene detalles completos de un programa de lealtad incluyendo reglas y enrollments',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({
    status: 200,
    description: 'Detalles del programa de lealtad',
    type: GetLoyaltyProgramResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getLoyaltyProgram(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetLoyaltyProgramResponse> {
    const request = new GetLoyaltyProgramRequest();
    request.tenantId = tenantId;
    request.programId = programId;

    return this.getLoyaltyProgramHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear programa de lealtad',
    description: 'Crea un nuevo programa de lealtad para un tenant',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiResponse({
    status: 201,
    description: 'Programa creado exitosamente',
    type: CreateLoyaltyProgramResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado', type: NotFoundErrorResponseDto })
  async createLoyaltyProgram(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() body: CreateLoyaltyProgramRequest,
    @CurrentUser() user?: JwtPayload,
  ): Promise<CreateLoyaltyProgramResponse> {
    body.tenantId = tenantId;
    return this.createLoyaltyProgramHandler.execute(body);
  }

  @Patch(':programId')
  @ApiOperation({
    summary: 'Actualizar programa de lealtad',
    description: 'Actualiza un programa de lealtad existente (actualización parcial)',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({
    status: 200,
    description: 'Programa actualizado exitosamente',
    type: UpdateLoyaltyProgramResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async updateLoyaltyProgram(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: Partial<UpdateLoyaltyProgramRequest>,
    @CurrentUser() user?: JwtPayload,
  ): Promise<UpdateLoyaltyProgramResponse> {
    const request = new UpdateLoyaltyProgramRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    Object.assign(request, body);

    return this.updateLoyaltyProgramHandler.execute(request);
  }

  @Delete(':programId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar programa de lealtad',
    description:
      'Elimina un programa de lealtad (solo si no tiene reglas activas ni enrollments activos)',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({ status: 204, description: 'Programa eliminado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar (tiene dependencias)',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async deleteLoyaltyProgram(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    const request = new DeleteLoyaltyProgramRequest();
    request.tenantId = tenantId;
    request.programId = programId;

    return this.deleteLoyaltyProgramHandler.execute(request);
  }
}
