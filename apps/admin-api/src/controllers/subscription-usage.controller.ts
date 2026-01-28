import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateSubscriptionUsageHandler,
  CreateSubscriptionUsageRequest,
  CreateSubscriptionUsageResponse,
  GetSubscriptionUsageHandler,
  GetSubscriptionUsageRequest,
  GetSubscriptionUsageResponse,
  UpdateSubscriptionUsageHandler,
  UpdateSubscriptionUsageRequest,
  UpdateSubscriptionUsageResponse,
  DeleteSubscriptionUsageHandler,
  DeleteSubscriptionUsageRequest,
  DeleteSubscriptionUsageResponse,
  RecalculateSubscriptionUsageHandler,
  RecalculateSubscriptionUsageRequest,
  RecalculateSubscriptionUsageResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de uso de suscripciones para Admin API
 * Permite gestionar el uso de recursos de las suscripciones
 */
@ApiTags('Subscription Usage')
@Controller('subscription-usage')
export class SubscriptionUsageController {
  constructor(
    private readonly createSubscriptionUsageHandler: CreateSubscriptionUsageHandler,
    private readonly getSubscriptionUsageHandler: GetSubscriptionUsageHandler,
    private readonly updateSubscriptionUsageHandler: UpdateSubscriptionUsageHandler,
    private readonly deleteSubscriptionUsageHandler: DeleteSubscriptionUsageHandler,
    private readonly recalculateSubscriptionUsageHandler: RecalculateSubscriptionUsageHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear registro de uso de suscripción',
    description: 'Crea un nuevo registro de uso para una suscripción',
  })
  @ApiBody({
    type: CreateSubscriptionUsageRequest,
    description: 'Datos del registro de uso a crear',
    examples: {
      ejemplo1: {
        summary: 'Registro de uso básico',
        description: 'Ejemplo de creación de registro de uso',
        value: {
          partnerSubscriptionId: 1,
          tenantsCount: 2,
          branchesCount: 8,
          customersCount: 2345,
          rewardsCount: 15,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registro de uso creado exitosamente',
    type: CreateSubscriptionUsageResponse,
    example: {
      id: 1,
      partnerSubscriptionId: 1,
      tenantsCount: 2,
      branchesCount: 8,
      customersCount: 2345,
      rewardsCount: 15,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o registro de uso ya existe',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'partnerSubscriptionId must be a positive number',
        'Usage record already exists for this subscription. Use update instead.',
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Suscripción no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
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
  async create(
    @Body() request: CreateSubscriptionUsageRequest,
  ): Promise<CreateSubscriptionUsageResponse> {
    return this.createSubscriptionUsageHandler.execute(request);
  }

  @Get(':subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener uso de suscripción',
    description: 'Obtiene el registro de uso de una suscripción específica',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de uso encontrado',
    type: GetSubscriptionUsageResponse,
    example: {
      id: 1,
      partnerSubscriptionId: 1,
      tenantsCount: 2,
      branchesCount: 8,
      customersCount: 2345,
      rewardsCount: 15,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de uso no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usage record for subscription ID 1 not found',
      error: 'Not Found',
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
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
  async get(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
  ): Promise<GetSubscriptionUsageResponse> {
    const request = new GetSubscriptionUsageRequest();
    request.partnerSubscriptionId = subscriptionId;
    return this.getSubscriptionUsageHandler.execute(request);
  }

  @Patch(':subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar uso de suscripción',
    description: 'Actualiza el registro de uso de una suscripción',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateSubscriptionUsageRequest,
    description: 'Datos a actualizar',
    examples: {
      ejemplo1: {
        summary: 'Actualizar uso de suscripción',
        description: 'Ejemplo de actualización de registro de uso',
        value: {
          tenantsCount: 3,
          branchesCount: 10,
          customersCount: 3000,
          rewardsCount: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de uso actualizado exitosamente',
    type: UpdateSubscriptionUsageResponse,
    example: {
      id: 1,
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'tenantsCount must be a positive number',
        'customersCount must be a positive number',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de uso no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usage record for subscription ID 1 not found',
      error: 'Not Found',
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
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
  async update(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
    @Body() request: UpdateSubscriptionUsageRequest,
  ): Promise<UpdateSubscriptionUsageResponse> {
    request.partnerSubscriptionId = subscriptionId;
    return this.updateSubscriptionUsageHandler.execute(request);
  }

  @Delete(':subscriptionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar uso de suscripción',
    description: 'Elimina el registro de uso de una suscripción',
  })
  @ApiParam({
    name: 'subscriptionId',
    description: 'ID de la suscripción',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de uso eliminado exitosamente',
    type: DeleteSubscriptionUsageResponse,
    example: {
      partnerSubscriptionId: 1,
      message: 'Subscription usage deleted successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de uso no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usage record for subscription ID 1 not found',
      error: 'Not Found',
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
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
  async delete(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
  ): Promise<DeleteSubscriptionUsageResponse> {
    const request = new DeleteSubscriptionUsageRequest();
    request.partnerSubscriptionId = subscriptionId;
    return this.deleteSubscriptionUsageHandler.execute(request);
  }

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Recalcular uso de suscripción',
    description:
      'Recalcula el uso de suscripción desde los datos reales de la base de datos. Puede recalcular un partner específico, una suscripción específica, o todos los partners activos si no se proporcionan parámetros.',
  })
  @ApiBody({
    type: RecalculateSubscriptionUsageRequest,
    description: 'Parámetros opcionales para el recálculo',
    examples: {
      ejemplo1: {
        summary: 'Recalcular un partner específico',
        description: 'Recalcula el uso de suscripción para un partner específico',
        value: {
          partnerId: 1,
        },
      },
      ejemplo2: {
        summary: 'Recalcular una suscripción específica',
        description: 'Recalcula el uso de suscripción para una suscripción específica',
        value: {
          partnerSubscriptionId: 1,
        },
      },
      ejemplo3: {
        summary: 'Recalcular todos los partners',
        description: 'Recalcula el uso de suscripción para todos los partners activos (body vacío)',
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Recálculo completado exitosamente',
    type: RecalculateSubscriptionUsageResponse,
    example: {
      message: 'Subscription usage recalculated successfully',
      recalculatedCount: 1,
      results: [
        {
          partnerId: 1,
          partnerSubscriptionId: 1,
          tenantsCount: 3,
          branchesCount: 12,
          customersCount: 2345,
          rewardsCount: 15,
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['partnerId must be a positive number'],
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner o suscripción no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Subscription with ID 1 not found',
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
  async recalculate(
    @Body() request: RecalculateSubscriptionUsageRequest,
  ): Promise<RecalculateSubscriptionUsageResponse> {
    return this.recalculateSubscriptionUsageHandler.execute(request);
  }
}
