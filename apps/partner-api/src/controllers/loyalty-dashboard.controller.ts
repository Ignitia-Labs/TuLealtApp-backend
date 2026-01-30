import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  GetLoyaltyDashboardHandler,
  GetLoyaltyDashboardRequest,
  GetLoyaltyDashboardResponse,
} from '@libs/application';
import {
  JwtAuthGuard,
  RolesGuard,
  PartnerResourceGuard,
  Roles,
  CurrentUser,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de dashboard de lealtad para Partner API
 * Permite obtener métricas generales del programa de lealtad de un tenant
 */
@ApiTags('Loyalty Dashboard')
@Controller('tenants/:tenantId/loyalty/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class LoyaltyDashboardController {
  constructor(private readonly getLoyaltyDashboardHandler: GetLoyaltyDashboardHandler) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener dashboard de lealtad',
    description:
      'Obtiene métricas generales del programa de lealtad del tenant: total de customers, puntos emitidos/canjeados, top reward rules y actividad reciente. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard de lealtad obtenido exitosamente',
    type: GetLoyaltyDashboardResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos o el tenant no pertenece a su partner',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getLoyaltyDashboard(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<GetLoyaltyDashboardResponse> {
    const request = new GetLoyaltyDashboardRequest();
    request.tenantId = tenantId;

    return this.getLoyaltyDashboardHandler.execute(request);
  }
}
