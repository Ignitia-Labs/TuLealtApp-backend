import {
  Controller,
  Get,
  Post,
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
  GetEnrollmentsHandler,
  GetEnrollmentsRequest,
  GetEnrollmentsResponse,
  CreateEnrollmentHandler,
  CreateEnrollmentRequest,
  CreateEnrollmentResponse,
  DeleteEnrollmentHandler,
  DeleteEnrollmentRequest,
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
 * Controlador de enrollments para Partner API
 * Permite gestionar inscripciones de customers en programas de lealtad
 */
@ApiTags('Enrollments')
@Controller('tenants/:tenantId/loyalty-programs/:programId/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class EnrollmentsController {
  constructor(
    private readonly getEnrollmentsHandler: GetEnrollmentsHandler,
    private readonly createEnrollmentHandler: CreateEnrollmentHandler,
    private readonly deleteEnrollmentHandler: DeleteEnrollmentHandler,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar enrollments de un programa',
    description: 'Obtiene todas las inscripciones de un programa con filtros opcionales',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status',
    default: 'active',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Número de página',
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Elementos por página',
    default: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de enrollments',
    type: GetEnrollmentsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getEnrollments(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetEnrollmentsResponse> {
    const request = new GetEnrollmentsRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    request.status = status || 'active';
    request.page = page || 1;
    request.limit = limit || 20;

    return this.getEnrollmentsHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscribir customer en programa',
    description: 'Inscribe un customer en un programa de lealtad',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({
    status: 201,
    description: 'Customer inscrito exitosamente',
    type: CreateEnrollmentResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o ya está inscrito',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Programa o membership no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async createEnrollment(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: CreateEnrollmentRequest,
    @CurrentUser() user?: JwtPayload,
  ): Promise<CreateEnrollmentResponse> {
    body.tenantId = tenantId;
    body.programId = programId;
    return this.createEnrollmentHandler.execute(body);
  }

  @Delete(':enrollmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desinscribir customer de programa',
    description: 'Desinscribe un customer de un programa de lealtad',
  })
  @ApiParam({ name: 'tenantId', type: Number, description: 'ID del tenant' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiParam({ name: 'enrollmentId', type: Number, description: 'ID del enrollment' })
  @ApiResponse({ status: 204, description: 'Customer desinscrito exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Enrollment no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async deleteEnrollment(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('programId', ParseIntPipe) programId: number,
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    const request = new DeleteEnrollmentRequest();
    request.tenantId = tenantId;
    request.programId = programId;
    request.enrollmentId = enrollmentId;

    return this.deleteEnrollmentHandler.execute(request);
  }
}
