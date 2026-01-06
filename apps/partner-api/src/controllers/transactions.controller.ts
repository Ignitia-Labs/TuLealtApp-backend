import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  EarnPointsHandler,
  EarnPointsRequest,
  EarnPointsResponse,
  RedeemPointsHandler,
  RedeemPointsRequest,
  RedeemPointsResponse,
  GetTransactionsHandler,
  GetTransactionsRequest,
  GetTransactionsResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ICustomerMembershipRepository, ITenantRepository } from '@libs/domain';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';

/**
 * Controlador de Transactions para Partner API
 * Permite gestionar transacciones de puntos
 *
 * Endpoints:
 * - GET /partner/transactions/customer/:qrCode - Obtener transacciones de un customer (por QR code)
 * - GET /partner/transactions/user/:userId - Obtener transacciones de un customer (por userId, más rápido)
 * - POST /partner/transactions/earn - Acumular puntos (earn)
 * - POST /partner/transactions/redeem - Canjear puntos (redeem)
 */
@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER', 'PARTNER_STAFF')
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(
    private readonly earnPointsHandler: EarnPointsHandler,
    private readonly redeemPointsHandler: RedeemPointsHandler,
    private readonly getTransactionsHandler: GetTransactionsHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  @Post('earn')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Acumular puntos (earn)',
    description:
      'Acumula puntos para un customer. Puede calcular puntos automáticamente usando points rules si se proporciona `amount`, o usar `points` directamente. Actualiza automáticamente el balance y recalcula el tier del customer.',
  })
  @ApiBody({
    type: EarnPointsRequest,
    description:
      'Datos para acumular puntos. Puedes usar `amount` para calcular puntos automáticamente o `points` para asignar puntos directamente. El campo `transactionReference` es obligatorio y debe hacer referencia única a la compra o transacción.',
    examples: {
      compraConMonto: {
        summary: 'Compra con monto (cálculo automático)',
        description:
          'Calcula puntos automáticamente usando points rules basado en el monto de compra. Ejemplo: compra de Q150.00',
        value: {
          qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
          transactionReference: 'FAC-001234',
          amount: 150.0,
          description: 'Compra FAC-001234 - Juan Pérez',
          metadata: {
            orderId: 'FAC-001234',
            branchId: 5,
            branchName: 'Sucursal Centro',
            cashierId: 10,
            cashierName: 'María González',
            paymentMethod: 'cash',
            items: [{ productId: 101, name: 'Café Latte', quantity: 2, price: 75.0 }],
          },
        },
      },
      compraGrande: {
        summary: 'Compra grande (monto alto)',
        description: 'Ejemplo de compra grande que generará más puntos',
        value: {
          qrCode: 'QR-USER-15-TENANT-2-B4C6D8',
          transactionReference: 'FAC-005678',
          amount: 500.0,
          description: 'Compra FAC-005678 - Ana Martínez - Compra mayorista',
          metadata: {
            orderId: 'FAC-005678',
            branchId: 8,
            branchName: 'Sucursal Zona 10',
            cashierId: 15,
            cashierName: 'Carlos Rodríguez',
            paymentMethod: 'credit_card',
            customerType: 'wholesale',
            items: [{ productId: 205, name: 'Producto Premium', quantity: 10, price: 50.0 }],
          },
        },
      },
      puntosManuales: {
        summary: 'Puntos manuales (sin monto)',
        description:
          'Asigna puntos directamente sin calcular. Útil para bonificaciones especiales, promociones o correcciones.',
        value: {
          qrCode: 'QR-USER-20-TENANT-1-C5D7E9',
          transactionReference: 'BON-2024-001',
          points: 250,
          description: 'Bonificación especial - Cliente frecuente',
          metadata: {
            branchId: 5,
            branchName: 'Sucursal Centro',
            cashierId: 10,
            cashierName: 'María González',
            reason: 'bonification',
            promotionId: 12,
            notes: 'Cliente con más de 50 visitas',
          },
        },
      },
      promocionEspecial: {
        summary: 'Promoción especial (doble puntos)',
        description: 'Ejemplo de acumulación durante una promoción especial con metadata adicional',
        value: {
          qrCode: 'QR-USER-25-TENANT-2-D6E8F0',
          transactionReference: 'FAC-009999',
          amount: 200.0,
          description: 'Compra promocional - Día del Cliente',
          metadata: {
            orderId: 'FAC-009999',
            branchId: 8,
            branchName: 'Sucursal Zona 10',
            cashierId: 15,
            cashierName: 'Carlos Rodríguez',
            paymentMethod: 'debit_card',
            promotionId: 25,
            promotionName: 'Día del Cliente - Doble Puntos',
            multiplier: 2.0,
            basePoints: 200,
            bonusPoints: 200,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Puntos acumulados exitosamente. La respuesta incluye la transacción creada, el nuevo balance del customer y su tier actualizado.',
    type: EarnPointsResponse,
    example: {
      transaction: {
        id: 1,
        userId: 10,
        membershipId: 1,
        type: 'earn',
        points: 150,
        description: 'Compra FAC-001234 - Juan Pérez',
        transactionReference: 'FAC-001234',
        metadata: {
          amount: 150.0,
          orderId: 'FAC-001234',
          branchId: 5,
          branchName: 'Sucursal Centro',
          cashierId: 10,
          cashierName: 'María González',
          qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
          tenantId: 1,
          paymentMethod: 'cash',
        },
        status: 'completed',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      newBalance: 1650,
      previousBalance: 1500,
      pointsEarned: 150,
      tierId: 2,
      tierName: 'Oro',
      tierColor: '#FFD700',
      tierChanged: false,
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos. Puede ser por datos faltantes (no se proporcionó ni points ni amount) o valores inválidos.',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'transactionReference should not be empty',
        'transactionReference must be a string',
        'Either points or amount must be provided',
        'points must be a positive number',
        'amount must be greater than 0',
        'qrCode should not be empty',
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
    description: 'No tiene permisos suficientes o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Customer does not belong to your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer with QR code QR-USER-10-TENANT-1-A3B5C7 not found',
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
  async earnPoints(
    @CurrentUser() user: JwtPayload,
    @Body() request: EarnPointsRequest,
  ): Promise<EarnPointsResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    return this.earnPointsHandler.execute(request, currentUser.partnerId);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Canjear puntos (redeem)',
    description:
      'Canjea puntos de un customer. Resta puntos del balance y recalcula automáticamente el tier del customer. Verifica que el customer tenga suficientes puntos antes de canjear. Si el customer no tiene suficientes puntos, retorna un error 400.',
  })
  @ApiBody({
    type: RedeemPointsRequest,
    description:
      'Datos para canjear puntos. El customer debe tener suficientes puntos en su balance para realizar el canje. El campo `transactionReference` es obligatorio y debe hacer referencia única al canje o redención.',
    examples: {
      canjeRecompensa: {
        summary: 'Canje de recompensa básica',
        description:
          'Canje simple de puntos para una recompensa (ej: café gratis, producto pequeño)',
        value: {
          qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
          transactionReference: 'RED-2024-001',
          points: 100,
          description: 'Canje de recompensa - Café gratis',
          metadata: {
            rewardId: 5,
            rewardName: 'Café gratis',
            branchId: 5,
            branchName: 'Sucursal Centro',
            cashierId: 10,
            cashierName: 'María González',
            redemptionCode: 'RED-2024-001',
          },
        },
      },
      canjeDescuento: {
        summary: 'Canje de descuento porcentual',
        description: 'Canje de puntos para aplicar un descuento porcentual en la próxima compra',
        value: {
          qrCode: 'QR-USER-15-TENANT-2-B4C6D8',
          transactionReference: 'RED-2024-002',
          points: 500,
          description: 'Canje de descuento del 20%',
          metadata: {
            rewardId: 12,
            rewardName: 'Descuento 20%',
            branchId: 8,
            branchName: 'Sucursal Zona 10',
            cashierId: 15,
            cashierName: 'Carlos Rodríguez',
            discountType: 'percentage',
            discountValue: 20,
            validUntil: '2024-02-15T23:59:59.000Z',
            redemptionCode: 'RED-2024-002',
          },
        },
      },
      canjeProductoFisico: {
        summary: 'Canje de producto físico',
        description: 'Canje de puntos para obtener un producto físico (ej: taza, camiseta, etc.)',
        value: {
          qrCode: 'QR-USER-20-TENANT-1-C5D7E9',
          transactionReference: 'RED-2024-003',
          points: 1000,
          description: 'Canje de producto - Taza personalizada',
          metadata: {
            rewardId: 25,
            rewardName: 'Taza personalizada',
            branchId: 5,
            branchName: 'Sucursal Centro',
            cashierId: 10,
            cashierName: 'María González',
            productId: 100,
            productName: 'Taza personalizada',
            productSku: 'TZA-001',
            requiresPickup: true,
            pickupLocation: 'Sucursal Centro',
            redemptionCode: 'RED-2024-003',
          },
        },
      },
      canjeDescuentoFijo: {
        summary: 'Canje de descuento fijo',
        description:
          'Canje de puntos para obtener un descuento de monto fijo (ej: Q50 de descuento)',
        value: {
          qrCode: 'QR-USER-25-TENANT-2-D6E8F0',
          transactionReference: 'RED-2024-004',
          points: 750,
          description: 'Canje de descuento fijo - Q50.00',
          metadata: {
            rewardId: 30,
            rewardName: 'Descuento Q50',
            branchId: 8,
            branchName: 'Sucursal Zona 10',
            cashierId: 15,
            cashierName: 'Carlos Rodríguez',
            discountType: 'fixed',
            discountValue: 50.0,
            currency: 'GTQ',
            validUntil: '2024-03-01T23:59:59.000Z',
            minPurchaseAmount: 100.0,
            redemptionCode: 'RED-2024-004',
          },
        },
      },
      canjeExperiencia: {
        summary: 'Canje de experiencia',
        description:
          'Canje de puntos para una experiencia especial (ej: clase gratuita, evento exclusivo)',
        value: {
          qrCode: 'QR-USER-30-TENANT-1-E7F9G1',
          transactionReference: 'RED-2024-005',
          points: 2000,
          description: 'Canje de experiencia - Clase de barista gratuita',
          metadata: {
            rewardId: 40,
            rewardName: 'Clase de barista gratuita',
            branchId: 5,
            branchName: 'Sucursal Centro',
            cashierId: 10,
            cashierName: 'María González',
            experienceType: 'class',
            experienceDate: '2024-02-20T10:00:00.000Z',
            maxParticipants: 10,
            requiresReservation: true,
            redemptionCode: 'RED-2024-005',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Puntos canjeados exitosamente. La respuesta incluye la transacción de canje creada, el nuevo balance del customer y su tier actualizado (si cambió).',
    type: RedeemPointsResponse,
    example: {
      transaction: {
        id: 2,
        userId: 10,
        membershipId: 1,
        type: 'redeem',
        points: -100,
        description: 'Canje de recompensa - Café gratis',
        transactionReference: 'RED-2024-001',
        metadata: {
          rewardId: 5,
          rewardName: 'Café gratis',
          branchId: 5,
          branchName: 'Sucursal Centro',
          cashierId: 10,
          cashierName: 'María González',
          qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
          tenantId: 1,
          redemptionCode: 'RED-2024-001',
        },
        status: 'completed',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
      newBalance: 1400,
      previousBalance: 1500,
      pointsRedeemed: 100,
      tierId: 2,
      tierName: 'Oro',
      tierColor: '#FFD700',
      tierChanged: false,
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos o puntos insuficientes. El customer debe tener suficientes puntos en su balance para realizar el canje.',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'transactionReference should not be empty',
        'transactionReference must be a string',
        'Insufficient points. Customer has 50 points, but 100 are required',
        'points must be a positive number',
        'points must be greater than or equal to 1',
        'qrCode should not be empty',
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
    description: 'No tiene permisos suficientes o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Customer does not belong to your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer with QR code QR-USER-10-TENANT-1-A3B5C7 not found',
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
  async redeemPoints(
    @CurrentUser() user: JwtPayload,
    @Body() request: RedeemPointsRequest,
  ): Promise<RedeemPointsResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    return this.redeemPointsHandler.execute(request, currentUser.partnerId);
  }

  @Get('customer/:qrCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener transacciones de un customer',
    description:
      'Obtiene el historial de transacciones de puntos de un customer específico identificado por su QR code. Solo se pueden obtener transacciones de customers que pertenezcan al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'qrCode',
    description: 'QR code del customer',
    type: String,
    example: 'QR-USER-10-TENANT-1-A3B5C7',
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
          userId: 10,
          membershipId: 1,
          type: 'earn',
          points: 150,
          description: 'Compra FAC-001234 - Juan Pérez',
          transactionReference: 'FAC-001234',
          metadata: {
            amount: 150.0,
            orderId: 'FAC-001234',
            branchId: 5,
            branchName: 'Sucursal Centro',
            qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
            tenantId: 1,
          },
          status: 'completed',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          cashierId: 10,
          transactionDate: '2024-01-15T10:30:00.000Z',
          transactionAmountTotal: 150.0,
          netAmount: 129.31,
          taxAmount: 20.69,
          itemsCount: 3,
          pointsEarned: 150,
          pointsRuleId: 5,
          pointsMultiplier: 2.0,
          basePoints: 75,
          bonusPoints: 75,
        },
        {
          id: 2,
          userId: 10,
          membershipId: 1,
          type: 'redeem',
          points: -100,
          description: 'Canje de recompensa - Café gratis',
          transactionReference: 'RED-2024-001',
          metadata: {
            rewardId: 5,
            rewardName: 'Café gratis',
            branchId: 5,
            branchName: 'Sucursal Centro',
            qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
            tenantId: 1,
            redemptionCode: 'RED-2024-001',
          },
          status: 'completed',
          createdAt: '2024-01-14T15:20:00.000Z',
          updatedAt: '2024-01-14T15:20:00.000Z',
          cashierId: 10,
          transactionDate: '2024-01-14T15:20:00.000Z',
          transactionAmountTotal: null,
          netAmount: null,
          taxAmount: null,
          itemsCount: null,
          pointsEarned: null,
          pointsRuleId: null,
          pointsMultiplier: null,
          basePoints: null,
          bonusPoints: null,
        },
      ],
      total: 50,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'skip must be a number',
        'take must be a number',
        'type must be one of: earn, redeem, expire, adjust',
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
    description: 'No tiene permisos suficientes o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Customer does not belong to your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer with QR code QR-USER-10-TENANT-1-A3B5C7 not found',
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
  async getCustomerTransactions(
    @CurrentUser() user: JwtPayload,
    @Param('qrCode') qrCode: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('type') type?: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<GetTransactionsResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Buscar membership por QR code
    const membership = await this.membershipRepository.findByQrCode(qrCode);

    if (!membership) {
      throw new NotFoundException(`Customer with QR code ${qrCode} not found`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== currentUser.partnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Crear request para el handler
    const request = new GetTransactionsRequest();
    request.userId = membership.userId;
    request.skip = skip ? Number(skip) : undefined;
    request.take = take ? Number(take) : undefined;
    request.type = type;
    request.membershipId = membership.id;

    return this.getTransactionsHandler.execute(request);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener transacciones de un customer por userId',
    description:
      'Obtiene el historial de transacciones de puntos de un customer específico identificado por su userId. Esta versión es más rápida que usar QR code ya que no requiere buscar la membership primero. Solo se pueden obtener transacciones de customers que pertenezcan al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID único del usuario (customer)',
    type: Number,
    example: 10,
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
  @ApiQuery({
    name: 'membershipId',
    required: false,
    type: Number,
    description: 'ID de la membership específica para filtrar transacciones (opcional)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Transacciones obtenidas exitosamente',
    type: GetTransactionsResponse,
    example: {
      transactions: [
        {
          id: 1,
          userId: 10,
          membershipId: 1,
          type: 'earn',
          points: 150,
          description: 'Compra FAC-001234 - Juan Pérez',
          transactionReference: 'FAC-001234',
          metadata: {
            amount: 150.0,
            orderId: 'FAC-001234',
            branchId: 5,
            branchName: 'Sucursal Centro',
            qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
            tenantId: 1,
          },
          status: 'completed',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          cashierId: 10,
          transactionDate: '2024-01-15T10:30:00.000Z',
          transactionAmountTotal: 150.0,
          netAmount: 129.31,
          taxAmount: 20.69,
          itemsCount: 3,
          pointsEarned: 150,
          pointsRuleId: 5,
          pointsMultiplier: 2.0,
          basePoints: 75,
          bonusPoints: 75,
        },
        {
          id: 2,
          userId: 10,
          membershipId: 1,
          type: 'redeem',
          points: -100,
          description: 'Canje de recompensa - Café gratis',
          transactionReference: 'RED-2024-001',
          metadata: {
            rewardId: 5,
            rewardName: 'Café gratis',
            branchId: 5,
            branchName: 'Sucursal Centro',
            qrCode: 'QR-USER-10-TENANT-1-A3B5C7',
            tenantId: 1,
            redemptionCode: 'RED-2024-001',
          },
          status: 'completed',
          createdAt: '2024-01-14T15:20:00.000Z',
          updatedAt: '2024-01-14T15:20:00.000Z',
          cashierId: 10,
          transactionDate: '2024-01-14T15:20:00.000Z',
          transactionAmountTotal: null,
          netAmount: null,
          taxAmount: null,
          itemsCount: null,
          pointsEarned: null,
          pointsRuleId: null,
          pointsMultiplier: null,
          basePoints: null,
          bonusPoints: null,
        },
      ],
      total: 50,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'userId must be a number',
        'skip must be a number',
        'take must be a number',
        'type must be one of: earn, redeem, expire, adjust',
        'membershipId must be a number',
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
    description: 'No tiene permisos suficientes o el customer no pertenece a tu partner',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Customer does not belong to your partner',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Customer no encontrado o no tiene membership en tu partner',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Customer with ID 10 not found or does not belong to your partner',
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
  async getUserTransactions(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userIdParam: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('type') type?: 'earn' | 'redeem' | 'expire' | 'adjust',
    @Query('membershipId') membershipIdParam?: string,
  ): Promise<GetTransactionsResponse> {
    // Obtener el partnerId del usuario autenticado
    const currentUser = await this.userRepository.findById(user.userId);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    if (!currentUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Convertir userId a número
    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('userId must be a valid number');
    }

    // Buscar todas las memberships del usuario
    const memberships = await this.membershipRepository.findByUserId(userId);

    if (!memberships || memberships.length === 0) {
      throw new NotFoundException(
        `Customer with ID ${userId} not found or does not belong to your partner`,
      );
    }

    // Verificar que al menos una membership pertenezca a un tenant del partner
    let validMembership = null;
    for (const membership of memberships) {
      const tenant = await this.tenantRepository.findById(membership.tenantId);
      if (tenant && tenant.partnerId === currentUser.partnerId) {
        validMembership = membership;
        break;
      }
    }

    if (!validMembership) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Si se proporciona membershipId, validar que pertenezca al usuario y al partner
    let membershipId: number | undefined = undefined;
    if (membershipIdParam) {
      const requestedMembershipId = parseInt(membershipIdParam, 10);
      if (isNaN(requestedMembershipId)) {
        throw new BadRequestException('membershipId must be a valid number');
      }

      const requestedMembership = memberships.find((m) => m.id === requestedMembershipId);
      if (!requestedMembership) {
        throw new NotFoundException(
          `Membership with ID ${requestedMembershipId} not found for user ${userId}`,
        );
      }

      const requestedTenant = await this.tenantRepository.findById(requestedMembership.tenantId);
      if (!requestedTenant || requestedTenant.partnerId !== currentUser.partnerId) {
        throw new ForbiddenException(
          `Membership ${requestedMembershipId} does not belong to your partner`,
        );
      }

      membershipId = requestedMembershipId;
    }

    // Crear request para el handler
    const request = new GetTransactionsRequest();
    request.userId = userId;
    request.skip = skip ? Number(skip) : undefined;
    request.take = take ? Number(take) : undefined;
    request.type = type;
    request.membershipId = membershipId;

    return this.getTransactionsHandler.execute(request);
  }
}
