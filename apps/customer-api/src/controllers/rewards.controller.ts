import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetAvailableRewardsHandler,
  GetAvailableRewardsRequest,
  GetAvailableRewardsResponse,
  RedeemRewardHandler,
  RedeemRewardRequest,
  RedeemRewardResponse,
} from '@libs/application';
import {
  JwtAuthGuard,
  MembershipOwnershipGuard,
  CurrentUser,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';

/**
 * Controlador de recompensas canjeables para Customer API
 * Permite a los clientes ver recompensas disponibles y canjearlas con puntos
 */
@ApiTags('Rewards')
@Controller('memberships/:membershipId/rewards')
@UseGuards(JwtAuthGuard, MembershipOwnershipGuard)
@ApiBearerAuth('JWT-auth')
export class RewardsController {
  constructor(
    private readonly getAvailableRewardsHandler: GetAvailableRewardsHandler,
    private readonly redeemRewardHandler: RedeemRewardHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener recompensas disponibles' })
  @ApiParam({ name: 'membershipId', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Lista de recompensas disponibles',
    type: GetAvailableRewardsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Membership no encontrada', type: NotFoundErrorResponseDto })
  async getAvailableRewards(
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetAvailableRewardsResponse> {
    const request = new GetAvailableRewardsRequest();
    request.membershipId = membershipId;
    return this.getAvailableRewardsHandler.execute(request);
  }

  @Post(':rewardId/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Canjear recompensa' })
  @ApiParam({ name: 'membershipId', type: Number, description: 'ID de la membership' })
  @ApiParam({ name: 'rewardId', type: Number, description: 'ID de la recompensa' })
  @ApiResponse({
    status: 200,
    description: 'Recompensa canjeada exitosamente',
    type: RedeemRewardResponse,
  })
  @ApiResponse({ status: 400, description: 'No se puede canjear', type: BadRequestErrorResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Prohibido', type: ForbiddenErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Recompensa o membership no encontrada', type: NotFoundErrorResponseDto })
  async redeemReward(
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Param('rewardId', ParseIntPipe) rewardId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<RedeemRewardResponse> {
    const request = new RedeemRewardRequest();
    request.membershipId = membershipId;
    request.rewardId = rewardId;
    return this.redeemRewardHandler.execute(request);
  }
}
