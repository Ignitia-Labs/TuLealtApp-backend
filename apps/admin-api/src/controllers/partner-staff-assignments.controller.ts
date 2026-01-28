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
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreatePartnerStaffAssignmentHandler,
  CreatePartnerStaffAssignmentRequest,
  CreatePartnerStaffAssignmentResponse,
  UpdatePartnerStaffAssignmentHandler,
  UpdatePartnerStaffAssignmentRequest,
  UpdatePartnerStaffAssignmentResponse,
  DeletePartnerStaffAssignmentHandler,
  DeletePartnerStaffAssignmentRequest,
  GetPartnerStaffAssignmentsHandler,
  GetPartnerStaffAssignmentsRequest,
  GetPartnerStaffAssignmentsResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  CurrentUser,
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '@libs/shared';

/**
 * Controlador para gestionar asignaciones de usuarios STAFF a partners
 */
@ApiTags('Partner Staff Assignments')
@ApiBearerAuth('JWT-auth')
@Controller('admin/partner-staff-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PartnerStaffAssignmentsController {
  constructor(
    private readonly createHandler: CreatePartnerStaffAssignmentHandler,
    private readonly updateHandler: UpdatePartnerStaffAssignmentHandler,
    private readonly deleteHandler: DeletePartnerStaffAssignmentHandler,
    private readonly getHandler: GetPartnerStaffAssignmentsHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una asignación staff-partner',
    description:
      'Crea una nueva asignación de un usuario STAFF a un partner con un porcentaje de comisión',
  })
  @ApiBody({ type: CreatePartnerStaffAssignmentRequest })
  @ApiResponse({
    status: 201,
    description: 'Asignación creada exitosamente',
    type: CreatePartnerStaffAssignmentResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
  })
  async create(
    @Body() request: CreatePartnerStaffAssignmentRequest,
    @CurrentUser() user: any,
  ): Promise<CreatePartnerStaffAssignmentResponse> {
    return this.createHandler.execute(request);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener asignaciones staff-partner',
    description: 'Obtiene la lista de asignaciones con filtros opcionales por partner o staff',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de partner',
  })
  @ApiQuery({
    name: 'staffUserId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de usuario staff',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Solo asignaciones activas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaciones',
    type: GetPartnerStaffAssignmentsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos',
    type: ForbiddenErrorResponseDto,
  })
  async get(@Query() query: any): Promise<GetPartnerStaffAssignmentsResponse> {
    const request = new GetPartnerStaffAssignmentsRequest();
    if (query.partnerId) {
      request.partnerId = Number(query.partnerId);
    }
    if (query.staffUserId) {
      request.staffUserId = Number(query.staffUserId);
    }
    if (query.activeOnly !== undefined) {
      // Manejar tanto string como boolean
      if (typeof query.activeOnly === 'string') {
        request.activeOnly = query.activeOnly === 'true';
      } else {
        request.activeOnly = Boolean(query.activeOnly);
      }
    }
    return this.getHandler.execute(request);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una asignación staff-partner',
    description: 'Actualiza una asignación existente (porcentaje, fechas, estado activo)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la asignación',
  })
  @ApiBody({ type: UpdatePartnerStaffAssignmentRequest })
  @ApiResponse({
    status: 200,
    description: 'Asignación actualizada exitosamente',
    type: UpdatePartnerStaffAssignmentResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asignación no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos',
    type: ForbiddenErrorResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePartnerStaffAssignmentRequest,
  ): Promise<UpdatePartnerStaffAssignmentResponse> {
    return this.updateHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una asignación staff-partner',
    description: 'Elimina una asignación existente',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la asignación',
  })
  @ApiResponse({
    status: 204,
    description: 'Asignación eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Asignación no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos',
    type: ForbiddenErrorResponseDto,
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const request = new DeletePartnerStaffAssignmentRequest();
    request.id = id;
    return this.deleteHandler.execute(request);
  }

  @Get('partners/:partnerId')
  @ApiOperation({
    summary: 'Obtener asignaciones de un partner',
    description: 'Obtiene todas las asignaciones de un partner específico',
  })
  @ApiParam({
    name: 'partnerId',
    type: Number,
    description: 'ID del partner',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Solo asignaciones activas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaciones del partner',
    type: GetPartnerStaffAssignmentsResponse,
  })
  async getByPartner(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Query('activeOnly') activeOnly?: string | boolean,
  ): Promise<GetPartnerStaffAssignmentsResponse> {
    const request = new GetPartnerStaffAssignmentsRequest();
    request.partnerId = partnerId;
    if (activeOnly !== undefined) {
      if (typeof activeOnly === 'string') {
        request.activeOnly = activeOnly === 'true';
      } else {
        request.activeOnly = Boolean(activeOnly);
      }
    }
    return this.getHandler.execute(request);
  }

  @Get('staff/:staffUserId')
  @ApiOperation({
    summary: 'Obtener asignaciones de un usuario staff',
    description: 'Obtiene todas las asignaciones de un usuario staff específico',
  })
  @ApiParam({
    name: 'staffUserId',
    type: Number,
    description: 'ID del usuario staff',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Solo asignaciones activas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaciones del staff',
    type: GetPartnerStaffAssignmentsResponse,
  })
  async getByStaff(
    @Param('staffUserId', ParseIntPipe) staffUserId: number,
    @Query('activeOnly') activeOnly?: string | boolean,
  ): Promise<GetPartnerStaffAssignmentsResponse> {
    const request = new GetPartnerStaffAssignmentsRequest();
    request.staffUserId = staffUserId;
    if (activeOnly !== undefined) {
      if (typeof activeOnly === 'string') {
        request.activeOnly = activeOnly === 'true';
      } else {
        request.activeOnly = Boolean(activeOnly);
      }
    }
    return this.getHandler.execute(request);
  }
}
