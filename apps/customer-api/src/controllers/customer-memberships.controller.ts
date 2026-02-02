import {
  Controller,
  Get,
  Post,
  Delete,
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
  GetCustomerMembershipsHandler,
  GetCustomerMembershipsRequest,
  GetCustomerMembershipsResponse,
  GetCustomerMembershipHandler,
  GetCustomerMembershipRequest,
  GetCustomerMembershipResponse,
  GetPointsBalanceHandler,
  GetPointsBalanceRequest,
  GetPointsBalanceResponse,
  GetPointsTransactionsHandler,
  GetPointsTransactionsRequest,
  GetPointsTransactionsResponse,
  GetCustomerLoyaltyProgramsHandler,
  GetCustomerLoyaltyProgramsRequest,
  GetCustomerLoyaltyProgramsResponse,
  GetMembershipEnrollmentsHandler,
  GetMembershipEnrollmentsRequest,
  GetMembershipEnrollmentsResponse,
  GetUserEnrollmentsHandler,
  GetUserEnrollmentsRequest,
  GetUserEnrollmentsResponse,
  EnrollInProgramHandler,
  UnenrollFromProgramHandler,
  UnenrollFromProgramRequest,
  EnrollInProgramRequest,
  EnrollInProgramResponse,
  GetCurrentTierHandler,
  GetCurrentTierRequest,
  GetCurrentTierResponse,
  GetTierHistoryHandler,
  GetTierHistoryRequest,
  GetTierHistoryResponse,
  GetReferralCodeHandler,
  GetReferralCodeRequest,
  GetReferralCodeResponse,
  GetReferralsHandler,
  GetReferralsRequest,
  GetReferralsResponse,
  GetActivityHandler,
  GetActivityRequest,
  GetActivityResponse,
} from '@libs/application';
import { ICustomerMembershipRepository } from '@libs/domain';
import {
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  BadRequestErrorResponseDto,
  JwtAuthGuard,
  MembershipOwnershipGuard,
  CurrentUser,
} from '@libs/shared';
import { JwtPayload } from '@libs/application';
import { Inject, NotFoundException } from '@nestjs/common';

/**
 * Controlador de customer memberships para Customer API
 * Permite a los customers ver sus propias memberships
 *
 * Endpoints:
 * - GET /customer/memberships - Listar todas las memberships del usuario autenticado
 * - GET /customer/memberships/:id - Obtener membership específica del usuario autenticado
 * - GET /customer/memberships/qr/:qrCode - Buscar membership por QR code
 */
@ApiTags('Customer Memberships')
@Controller('memberships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerMembershipsController {
  constructor(
    private readonly getCustomerMembershipsHandler: GetCustomerMembershipsHandler,
    private readonly getCustomerMembershipHandler: GetCustomerMembershipHandler,
    private readonly getPointsBalanceHandler: GetPointsBalanceHandler,
    private readonly getPointsTransactionsHandler: GetPointsTransactionsHandler,
    private readonly getCustomerLoyaltyProgramsHandler: GetCustomerLoyaltyProgramsHandler,
    private readonly getMembershipEnrollmentsHandler: GetMembershipEnrollmentsHandler,
    private readonly getUserEnrollmentsHandler: GetUserEnrollmentsHandler,
    private readonly enrollInProgramHandler: EnrollInProgramHandler,
    private readonly unenrollFromProgramHandler: UnenrollFromProgramHandler,
    private readonly getCurrentTierHandler: GetCurrentTierHandler,
    private readonly getTierHistoryHandler: GetTierHistoryHandler,
    private readonly getReferralCodeHandler: GetReferralCodeHandler,
    private readonly getReferralsHandler: GetReferralsHandler,
    private readonly getActivityHandler: GetActivityHandler,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  @Get('enrollments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos mis enrollments',
    description:
      'Obtiene todos los enrollments de todas las memberships del usuario autenticado. Vista consolidada de todas las suscripciones a programas.',
  })
  @ApiQuery({
    name: 'status',
    enum: ['ACTIVE', 'PAUSED', 'ENDED', 'all'],
    required: false,
    description: 'Filtrar por status del enrollment',
    default: 'all',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollments obtenidos exitosamente',
    type: GetUserEnrollmentsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Error interno', type: InternalServerErrorResponseDto })
  async getMyEnrollments(
    @Query('status') status?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetUserEnrollmentsResponse> {
    const request = new GetUserEnrollmentsRequest();
    request.status = (status as any) || 'all';
    return this.getUserEnrollmentsHandler.execute(request, user!.userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar mis memberships',
    description:
      'Obtiene todas las memberships del usuario autenticado. Solo puede ver sus propias memberships.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    type: Number,
    description: 'ID del tenant para filtrar las memberships',
    example: 1,
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Si es true, solo retorna memberships activas',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de memberships obtenida exitosamente',
    type: GetCustomerMembershipsResponse,
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
  async getMyMemberships(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<GetCustomerMembershipsResponse> {
    const request = new GetCustomerMembershipsRequest();
    if (tenantId) {
      request.tenantId = parseInt(tenantId, 10);
    }
    if (activeOnly) {
      request.activeOnly = activeOnly === 'true';
    }
    return this.getCustomerMembershipsHandler.execute(request, user.userId, user.roles);
  }

  @Get('qr/:qrCode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Buscar membership por QR code',
    description:
      'Busca una membership por su QR code. Solo puede acceder a sus propias memberships.',
  })
  @ApiParam({
    name: 'qrCode',
    description: 'QR code de la membership',
    type: String,
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership encontrada',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a esta membership',
    type: ForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getMembershipByQrCode(
    @Param('qrCode') qrCode: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCustomerMembershipResponse> {
    const membership = await this.membershipRepository.findByQrCode(qrCode);
    if (!membership) {
      throw new NotFoundException(`Membership with QR code ${qrCode} not found`);
    }
    const request = new GetCustomerMembershipRequest();
    request.membershipId = membership.id;
    return this.getCustomerMembershipHandler.execute(request, user.userId, user.roles);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener mi membership por ID',
    description:
      'Obtiene una membership específica del usuario autenticado por su ID. Solo puede acceder a sus propias memberships.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la membership',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership encontrada',
    type: GetCustomerMembershipResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para acceder a esta membership',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'You can only access your own memberships',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getMyMembership(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetCustomerMembershipResponse> {
    const request = new GetCustomerMembershipRequest();
    request.membershipId = id;
    return this.getCustomerMembershipHandler.execute(request, user.userId, user.roles);
  }

  @Get(':id/points/balance')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener balance de puntos',
    description: 'Obtiene el balance actual de puntos de una membership',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Balance de puntos obtenido exitosamente',
    type: GetPointsBalanceResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getPointsBalance(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetPointsBalanceResponse> {
    const request = new GetPointsBalanceRequest();
    request.membershipId = id;
    return this.getPointsBalanceHandler.execute(request, user.userId);
  }

  @Get(':id/points/transactions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener historial de transacciones de puntos',
    description: 'Obtiene el historial de transacciones de puntos de una membership',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiQuery({
    name: 'type',
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'],
    required: false,
    description: 'Filtrar por tipo de transacción',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
    default: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de transacciones obtenido exitosamente',
    type: GetPointsTransactionsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getPointsTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetPointsTransactionsResponse> {
    const request = new GetPointsTransactionsRequest();
    request.membershipId = id;
    request.type = (type as any) || 'all';
    request.fromDate = fromDate;
    request.toDate = toDate;
    request.page = page || 1;
    request.limit = limit || 20;
    return this.getPointsTransactionsHandler.execute(request, user!.userId);
  }

  @Get(':id/loyalty-programs')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Listar programas de lealtad disponibles',
    description: 'Obtiene todos los programas de lealtad disponibles para la membership',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status del programa',
  })
  @ApiQuery({
    name: 'enrolled',
    enum: ['true', 'false', 'all'],
    required: false,
    description: 'Filtrar por si está inscrito',
  })
  @ApiResponse({
    status: 200,
    description: 'Programas de lealtad obtenidos exitosamente',
    type: GetCustomerLoyaltyProgramsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getLoyaltyPrograms(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: string,
    @Query('enrolled') enrolled?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetCustomerLoyaltyProgramsResponse> {
    const request = new GetCustomerLoyaltyProgramsRequest();
    request.membershipId = id;
    request.status = (status as any) || 'active';
    request.enrolled = (enrolled as any) || 'all';
    return this.getCustomerLoyaltyProgramsHandler.execute(request, user!.userId);
  }

  @Get(':id/enrollments')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener enrollments de una membership',
    description:
      'Obtiene todos los enrollments activos de una membership con información detallada del programa',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Enrollments obtenidos exitosamente',
    type: GetMembershipEnrollmentsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getMembershipEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetMembershipEnrollmentsResponse> {
    const request = new GetMembershipEnrollmentsRequest();
    request.membershipId = id;
    return this.getMembershipEnrollmentsHandler.execute(request, user!.userId);
  }

  @Post(':id/loyalty-programs/:programId/enroll')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Inscribirse en programa de lealtad',
    description: 'Inscribe al customer en un programa de lealtad',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({
    status: 201,
    description: 'Customer inscrito exitosamente',
    type: EnrollInProgramResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o ya está inscrito',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership o programa no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async enrollInProgram(
    @Param('id', ParseIntPipe) id: number,
    @Param('programId', ParseIntPipe) programId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<EnrollInProgramResponse> {
    const request = new EnrollInProgramRequest();
    request.membershipId = id;
    request.programId = programId;
    return this.enrollInProgramHandler.execute(request, user!.userId);
  }

  @Delete(':id/loyalty-programs/:programId/enroll')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Desinscribirse de un programa de lealtad',
    description:
      'Desinscribe al customer de un programa de lealtad. No se puede desinscribir del programa BASE.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiParam({ name: 'programId', type: Number, description: 'ID del programa' })
  @ApiResponse({
    status: 204,
    description: 'Desinscripción exitosa',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede desinscribir del BASE o enrollment no activo',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership, programa o enrollment no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async unenrollFromProgram(
    @Param('id', ParseIntPipe) id: number,
    @Param('programId', ParseIntPipe) programId: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    const request = new UnenrollFromProgramRequest();
    request.membershipId = id;
    request.programId = programId;
    return this.unenrollFromProgramHandler.execute(request, user!.userId);
  }

  @Get(':id/tier')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener tier actual',
    description: 'Obtiene información del tier actual del customer',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Tier actual obtenido exitosamente',
    type: GetCurrentTierResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getCurrentTier(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetCurrentTierResponse> {
    const request = new GetCurrentTierRequest();
    request.membershipId = id;
    return this.getCurrentTierHandler.execute(request, user!.userId);
  }

  @Get(':id/tier/history')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener historial de tiers',
    description: 'Obtiene el historial de cambios de tier',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Historial de tiers obtenido exitosamente',
    type: GetTierHistoryResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getTierHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetTierHistoryResponse> {
    const request = new GetTierHistoryRequest();
    request.membershipId = id;
    return this.getTierHistoryHandler.execute(request, user!.userId);
  }

  @Get(':id/referral-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener código de referido',
    description: 'Obtiene o genera el código de referido del customer',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Código de referido obtenido exitosamente',
    type: GetReferralCodeResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getReferralCode(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetReferralCodeResponse> {
    const request = new GetReferralCodeRequest();
    request.membershipId = id;
    return this.getReferralCodeHandler.execute(request, user!.userId);
  }

  @Get(':id/referrals')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Listar referidos',
    description: 'Obtiene la lista de referidos del customer',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiResponse({
    status: 200,
    description: 'Lista de referidos obtenida exitosamente',
    type: GetReferralsResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getReferrals(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetReferralsResponse> {
    const request = new GetReferralsRequest();
    request.membershipId = id;
    return this.getReferralsHandler.execute(request, user!.userId);
  }

  @Get(':id/activity')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MembershipOwnershipGuard)
  @ApiOperation({
    summary: 'Obtener actividad reciente',
    description: 'Obtiene actividad reciente (transacciones, cambios de tier, etc.)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la membership' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de elementos',
    default: 10,
  })
  @ApiQuery({
    name: 'type',
    enum: ['transactions', 'tier_changes', 'all'],
    required: false,
    description: 'Tipo de actividad',
    default: 'all',
  })
  @ApiResponse({
    status: 200,
    description: 'Actividad reciente obtenida exitosamente',
    type: GetActivityResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado', type: UnauthorizedErrorResponseDto })
  @ApiResponse({ status: 403, description: 'No autorizado', type: ForbiddenErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Membership no encontrada',
    type: NotFoundErrorResponseDto,
  })
  async getActivity(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetActivityResponse> {
    const request = new GetActivityRequest();
    request.membershipId = id;
    request.limit = limit || 10;
    request.type = (type as any) || 'all';
    return this.getActivityHandler.execute(request, user!.userId);
  }
}
