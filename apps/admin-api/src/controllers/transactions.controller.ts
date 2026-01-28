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
  GetTransactionsHandler,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de Transactions para Admin API
 * Permite consultar transacciones de puntos
 *
 * Endpoints:
 * - GET /admin/transactions/user/:userId - Obtener transacciones de un usuario
 */
@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly getTransactionsHandler: GetTransactionsHandler) {}

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener transacciones de un usuario',
    description: 'Obtiene el historial de transacciones de puntos de un usuario específico.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Número de elementos a omitir (paginación)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Cantidad de elementos a retornar',
    example: 20,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Tipo de transacción para filtrar',
    enum: ['earn', 'redeem', 'expire', 'adjust'],
    example: 'earn',
  })
  @ApiResponse({
    status: 200,
    description: 'Transacciones obtenidas exitosamente',
    type: GetTransactionsResponse,
    example: {
      transactions: [
        {
          id: 1,
          userId: 1,
          type: 'earn',
          points: 100,
          description: 'Puntos ganados por compra',
          metadata: { orderId: 123 },
          status: 'completed',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      total: 50,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['userId must be a number', 'skip must be a number'],
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
    description: 'No tiene permisos de administrador',
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
  async getTransactions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('type') type?: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<GetTransactionsResponse> {
    const request = new GetTransactionsRequest();
    request.userId = userId;
    request.skip = skip ? parseInt(skip.toString(), 10) : undefined;
    request.take = take ? parseInt(take.toString(), 10) : undefined;
    request.type = type;
    return this.getTransactionsHandler.execute(request);
  }
}
