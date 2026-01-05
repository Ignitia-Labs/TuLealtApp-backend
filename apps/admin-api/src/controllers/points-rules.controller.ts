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
  GetPointsRulesHandler,
  GetPointsRulesRequest,
  GetPointsRulesResponse,
  GetPointsRuleHandler,
  GetPointsRuleRequest,
  GetPointsRuleResponse,
  CreatePointsRuleHandler,
  CreatePointsRuleRequest,
  CreatePointsRuleResponse,
  UpdatePointsRuleHandler,
  UpdatePointsRuleRequest,
  UpdatePointsRuleResponse,
  DeletePointsRuleHandler,
  DeletePointsRuleRequest,
  DeletePointsRuleResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de Points Rules para Admin API
 * Permite gestionar las reglas de puntos del sistema
 *
 * Endpoints:
 * - GET /admin/points-rules?tenantId={id} - Listar reglas de puntos por tenant
 * - POST /admin/points-rules - Crear una nueva regla de puntos
 * - GET /admin/points-rules/:id - Obtener regla de puntos por ID
 * - PATCH /admin/points-rules/:id - Actualizar regla de puntos (actualización parcial)
 * - DELETE /admin/points-rules/:id - Eliminar regla de puntos
 */
@ApiTags('Points Rules')
@Controller('points-rules')
export class PointsRulesController {
  constructor(
    private readonly getPointsRulesHandler: GetPointsRulesHandler,
    private readonly getPointsRuleHandler: GetPointsRuleHandler,
    private readonly createPointsRuleHandler: CreatePointsRuleHandler,
    private readonly updatePointsRuleHandler: UpdatePointsRuleHandler,
    private readonly deletePointsRuleHandler: DeletePointsRuleHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar reglas de puntos por tenant',
    description:
      'Obtiene la lista de todas las reglas de puntos asociadas a un tenant específico. Requiere el parámetro query tenantId.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: true,
    type: Number,
    description: 'ID del tenant para filtrar las reglas de puntos',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas de puntos obtenida exitosamente',
    type: GetPointsRulesResponse,
    example: {
      rules: [
        {
          id: 1,
          tenantId: 1,
          name: 'Puntos por compra',
          description: 'Gana 1 punto por cada Q10.00 de compra',
          type: 'purchase',
          pointsPerUnit: 0.1,
          minAmount: 50.0,
          multiplier: null,
          applicableDays: [1, 2, 3, 4, 5],
          applicableHours: { start: '09:00', end: '18:00' },
          validFrom: '2024-01-01T00:00:00.000Z',
          validUntil: '2024-12-31T23:59:59.999Z',
          status: 'active',
          priority: 1,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
          id: 2,
          tenantId: 1,
          name: 'Puntos por visita',
          description: 'Gana 10 puntos por cada visita',
          type: 'visit',
          pointsPerUnit: 10,
          minAmount: null,
          multiplier: null,
          applicableDays: null,
          applicableHours: null,
          validFrom: null,
          validUntil: null,
          status: 'active',
          priority: 2,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      total: 2,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['tenantId must be a number', 'tenantId must be greater than or equal to 1'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getPointsRules(
    @Query('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<GetPointsRulesResponse> {
    const request = new GetPointsRulesRequest();
    request.tenantId = tenantId;
    return this.getPointsRulesHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear una nueva regla de puntos',
    description:
      'Crea una nueva regla de puntos asociada a un tenant con su configuración completa.',
  })
  @ApiBody({
    type: CreatePointsRuleRequest,
    description: 'Datos de la regla de puntos a crear',
    examples: {
      ejemplo1: {
        summary: 'Regla básica por compra',
        description: 'Ejemplo de creación de regla con datos mínimos',
        value: {
          tenantId: 1,
          name: 'Puntos por compra',
          description: 'Gana 1 punto por cada Q10.00 de compra',
          type: 'purchase',
          pointsPerUnit: 0.1,
        },
      },
      ejemplo2: {
        summary: 'Regla completa con restricciones',
        description: 'Ejemplo de creación de regla con todas las opciones',
        value: {
          tenantId: 1,
          name: 'Puntos por compra - Días laborables',
          description: 'Gana 1 punto por cada Q10.00 de compra, solo días laborables de 9am a 6pm',
          type: 'purchase',
          pointsPerUnit: 0.1,
          minAmount: 50.0,
          multiplier: 1.2,
          applicableDays: [1, 2, 3, 4, 5],
          applicableHours: { start: '09:00', end: '18:00' },
          validFrom: '2024-01-01T00:00:00.000Z',
          validUntil: '2024-12-31T23:59:59.999Z',
          status: 'active',
          priority: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Regla de puntos creada exitosamente',
    type: CreatePointsRuleResponse,
    example: {
      rule: {
        id: 1,
        tenantId: 1,
        name: 'Puntos por compra',
        description: 'Gana 1 punto por cada Q10.00 de compra',
        type: 'purchase',
        pointsPerUnit: 0.1,
        minAmount: 50.0,
        multiplier: null,
        applicableDays: [1, 2, 3, 4, 5],
        applicableHours: { start: '09:00', end: '18:00' },
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z',
        status: 'active',
        priority: 1,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'tenantId must be a number',
        'name should not be empty',
        'pointsPerUnit must be greater than or equal to 0.01',
        'validFrom must be before validUntil',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async createPointsRule(
    @Body() request: CreatePointsRuleRequest,
  ): Promise<CreatePointsRuleResponse> {
    return this.createPointsRuleHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener regla de puntos por ID',
    description: 'Obtiene la información completa de una regla de puntos por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la regla de puntos',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de puntos encontrada',
    type: GetPointsRuleResponse,
    example: {
      rule: {
        id: 1,
        tenantId: 1,
        name: 'Puntos por compra',
        description: 'Gana 1 punto por cada Q10.00 de compra',
        type: 'purchase',
        pointsPerUnit: 0.1,
        minAmount: 50.0,
        multiplier: null,
        applicableDays: [1, 2, 3, 4, 5],
        applicableHours: { start: '09:00', end: '18:00' },
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z',
        status: 'active',
        priority: 1,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Regla de puntos no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Points rule with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async getPointsRule(@Param('id', ParseIntPipe) id: number): Promise<GetPointsRuleResponse> {
    const request = new GetPointsRuleRequest();
    request.pointsRuleId = id;
    return this.getPointsRuleHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar regla de puntos',
    description:
      'Actualiza una regla de puntos existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la regla de puntos a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdatePointsRuleRequest,
    description: 'Datos de la regla de puntos a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo nombre y descripción',
        description: 'Ejemplo de actualización parcial de solo algunos campos',
        value: {
          name: 'Puntos por compra actualizado',
          description: 'Gana 2 puntos por cada Q10.00 de compra',
        },
      },
      ejemplo2: {
        summary: 'Actualizar estado y prioridad',
        description: 'Ejemplo de actualización de estado y prioridad',
        value: {
          status: 'inactive',
          priority: 5,
        },
      },
      ejemplo3: {
        summary: 'Actualizar horario aplicable',
        description: 'Ejemplo de actualización de horario aplicable',
        value: {
          applicableHours: { start: '08:00', end: '20:00' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de puntos actualizada exitosamente',
    type: UpdatePointsRuleResponse,
    example: {
      rule: {
        id: 1,
        tenantId: 1,
        name: 'Puntos por compra actualizado',
        description: 'Gana 2 puntos por cada Q10.00 de compra',
        type: 'purchase',
        pointsPerUnit: 0.1,
        minAmount: 50.0,
        multiplier: null,
        applicableDays: [1, 2, 3, 4, 5],
        applicableHours: { start: '09:00', end: '18:00' },
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.999Z',
        status: 'active',
        priority: 1,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-20T14:45:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'pointsPerUnit must be greater than or equal to 0.01',
        'validFrom must be before validUntil',
        'applicableHours.start must be before applicableHours.end',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Regla de puntos no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Points rule with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async updatePointsRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePointsRuleRequest,
  ): Promise<UpdatePointsRuleResponse> {
    return this.updatePointsRuleHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar regla de puntos',
    description: 'Elimina una regla de puntos del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la regla de puntos a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de puntos eliminada exitosamente',
    type: DeletePointsRuleResponse,
    example: {
      message: 'Points rule deleted successfully',
      id: 1,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Regla de puntos no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Points rule with ID 1 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: InternalServerErrorResponseDto,
    example: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  })
  async deletePointsRule(@Param('id', ParseIntPipe) id: number): Promise<DeletePointsRuleResponse> {
    const request = new DeletePointsRuleRequest();
    request.pointsRuleId = id;
    return this.deletePointsRuleHandler.execute(request);
  }
}
