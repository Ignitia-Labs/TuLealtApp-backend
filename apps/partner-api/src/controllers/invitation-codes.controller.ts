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
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateInvitationCodeHandler,
  CreateInvitationCodeRequest,
  CreateInvitationCodeResponse,
  GetInvitationCodesHandler,
  GetInvitationCodesRequest,
  GetInvitationCodesResponse,
  GetInvitationCodeHandler,
  GetInvitationCodeRequest,
  GetInvitationCodeResponse,
  GetInvitationCodeByCodeHandler,
  GetInvitationCodeByCodeRequest,
  GetInvitationCodeByCodeResponse,
  UpdateInvitationCodeHandler,
  UpdateInvitationCodeRequest,
  UpdateInvitationCodeResponse,
  DeleteInvitationCodeHandler,
  DeleteInvitationCodeRequest,
  DeleteInvitationCodeResponse,
  UseInvitationCodeHandler,
  UseInvitationCodeRequest,
  UseInvitationCodeResponse,
  SendInvitationEmailHandler,
  SendInvitationEmailRequest,
  SendInvitationEmailResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ITenantRepository } from '@libs/domain';
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

/**
 * Controlador de códigos de invitación para Partner API
 * Permite gestionar códigos de invitación de los tenants del partner autenticado
 *
 * Endpoints:
 * - POST /partner/tenants/:tenantId/invitation-codes - Crear código de invitación
 * - GET /partner/tenants/:tenantId/invitation-codes - Listar códigos de invitación
 * - GET /partner/invitation-codes/:id - Obtener código por ID
 * - GET /partner/invitation-codes/by-code/:code - Buscar por código
 * - PATCH /partner/invitation-codes/:id - Actualizar código
 * - DELETE /partner/invitation-codes/:id - Eliminar código
 * - POST /partner/invitation-codes/:id/use - Registrar uso del código
 */
@ApiTags('Invitation Codes')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class InvitationCodesController {
  constructor(
    private readonly createInvitationCodeHandler: CreateInvitationCodeHandler,
    private readonly getInvitationCodesHandler: GetInvitationCodesHandler,
    private readonly getInvitationCodeHandler: GetInvitationCodeHandler,
    private readonly getInvitationCodeByCodeHandler: GetInvitationCodeByCodeHandler,
    private readonly updateInvitationCodeHandler: UpdateInvitationCodeHandler,
    private readonly deleteInvitationCodeHandler: DeleteInvitationCodeHandler,
    private readonly useInvitationCodeHandler: UseInvitationCodeHandler,
    private readonly sendInvitationEmailHandler: SendInvitationEmailHandler,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  @Post('tenants/:tenantId/invitation-codes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear código de invitación',
    description:
      'Crea un nuevo código de invitación para un tenant. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiBody({
    type: CreateInvitationCodeRequest,
    description: 'Datos del código de invitación a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Código de invitación creado exitosamente',
    type: CreateInvitationCodeResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
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
    description: 'Tenant o branch no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async createInvitationCode(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() request: CreateInvitationCodeRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateInvitationCodeResponse> {
    // Validar ownership del tenant
    await this.validateTenantOwnership(tenantId, user);

    request.tenantId = tenantId;
    return this.createInvitationCodeHandler.execute(request, user.userId);
  }

  @Get('tenants/:tenantId/invitation-codes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar códigos de invitación de un tenant',
    description:
      'Obtiene la lista de códigos de invitación de un tenant. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'tenantId',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'expired', 'disabled'],
    required: false,
    description: 'Filtrar por estado del código',
  })
  @ApiQuery({
    name: 'includeExpired',
    type: Boolean,
    required: false,
    description: 'Incluir códigos expirados en los resultados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de códigos obtenida exitosamente',
    type: GetInvitationCodesResponse,
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
  async getInvitationCodes(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query('status') status?: 'active' | 'expired' | 'disabled',
    @Query('includeExpired') includeExpired?: boolean,
    @CurrentUser() user?: JwtPayload,
  ): Promise<GetInvitationCodesResponse> {
    // Validar ownership del tenant
    await this.validateTenantOwnership(tenantId, user);

    const request = new GetInvitationCodesRequest();
    request.tenantId = tenantId;
    request.status = status;
    request.includeExpired = includeExpired === true;

    return this.getInvitationCodesHandler.execute(request);
  }

  @Get('invitation-codes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener código de invitación por ID',
    description:
      'Obtiene la información de un código de invitación específico. El tenant del código debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del código de invitación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Código obtenido exitosamente',
    type: GetInvitationCodeResponse,
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
    description: 'Código no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getInvitationCode(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetInvitationCodeResponse> {
    const request = new GetInvitationCodeRequest();
    request.id = id;

    const code = await this.getInvitationCodeHandler.execute(request);

    // Validar ownership del tenant del código
    await this.validateTenantOwnership(code.tenantId, user);

    return code;
  }

  @Get('invitation-codes/by-code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar código de invitación por su valor',
    description:
      'Busca un código de invitación por su valor (string). El tenant del código debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Código de invitación a buscar',
    example: 'INV-ABC23456',
  })
  @ApiResponse({
    status: 200,
    description: 'Código obtenido exitosamente',
    type: GetInvitationCodeByCodeResponse,
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
    description: 'Código no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async getInvitationCodeByCode(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<GetInvitationCodeByCodeResponse> {
    const request = new GetInvitationCodeByCodeRequest();
    request.code = code;

    const codeResponse = await this.getInvitationCodeByCodeHandler.execute(request);

    // Validar ownership del tenant del código
    await this.validateTenantOwnership(codeResponse.tenantId, user);

    return codeResponse;
  }

  @Patch('invitation-codes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar código de invitación',
    description:
      'Actualiza un código de invitación existente. El tenant del código debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del código de invitación',
    example: 1,
  })
  @ApiBody({
    type: UpdateInvitationCodeRequest,
    description: 'Datos a actualizar del código de invitación',
  })
  @ApiResponse({
    status: 200,
    description: 'Código actualizado exitosamente',
    type: UpdateInvitationCodeResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
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
    description: 'Código o branch no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async updateInvitationCode(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateInvitationCodeRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateInvitationCodeResponse> {
    // Primero obtener el código para validar ownership
    const getRequest = new GetInvitationCodeRequest();
    getRequest.id = id;
    const code = await this.getInvitationCodeHandler.execute(getRequest);

    // Validar ownership del tenant del código
    await this.validateTenantOwnership(code.tenantId, user);

    return this.updateInvitationCodeHandler.execute(id, request);
  }

  @Delete('invitation-codes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar código de invitación',
    description:
      'Elimina un código de invitación. El tenant del código debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del código de invitación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Código eliminado exitosamente',
    type: DeleteInvitationCodeResponse,
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
    description: 'Código no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async deleteInvitationCode(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteInvitationCodeResponse> {
    // Primero obtener el código para validar ownership
    const getRequest = new GetInvitationCodeRequest();
    getRequest.id = id;
    const code = await this.getInvitationCodeHandler.execute(getRequest);

    // Validar ownership del tenant del código
    await this.validateTenantOwnership(code.tenantId, user);

    const request = new DeleteInvitationCodeRequest();
    request.id = id;

    return this.deleteInvitationCodeHandler.execute(request);
  }

  @Post('invitation-codes/:id/use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar uso de código de invitación',
    description:
      'Incrementa manualmente el contador de usos de un código de invitación. El tenant del código debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del código de invitación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Uso registrado exitosamente',
    type: UseInvitationCodeResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Código no válido (expirado, deshabilitado o límite alcanzado)',
    type: BadRequestErrorResponseDto,
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
    description: 'Código no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async useInvitationCode(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<UseInvitationCodeResponse> {
    // Primero obtener el código para validar ownership
    const getRequest = new GetInvitationCodeRequest();
    getRequest.id = id;
    const code = await this.getInvitationCodeHandler.execute(getRequest);

    // Validar ownership del tenant del código
    await this.validateTenantOwnership(code.tenantId, user);

    const request = new UseInvitationCodeRequest();
    request.id = id;

    return this.useInvitationCodeHandler.execute(request);
  }

  @Post('invitation-codes/:id/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-enviar email de invitación',
    description:
      'Re-envía el email de invitación con magic link para un código de invitación existente. El tenant del código debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del código de invitación',
    example: 1,
  })
  @ApiBody({
    type: SendInvitationEmailRequest,
    description: 'Datos para re-enviar el email de invitación',
  })
  @ApiResponse({
    status: 200,
    description: 'Email re-enviado exitosamente',
    type: SendInvitationEmailResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
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
    description: 'Código no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async sendInvitationEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: SendInvitationEmailRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<SendInvitationEmailResponse> {
    // Primero obtener el código para validar ownership
    const getRequest = new GetInvitationCodeRequest();
    getRequest.id = id;
    const code = await this.getInvitationCodeHandler.execute(getRequest);

    // Validar ownership del tenant del código
    await this.validateTenantOwnership(code.tenantId, user);

    return this.sendInvitationEmailHandler.execute(id, request);
  }

  /**
   * Valida que el tenant pertenezca al partner del usuario autenticado
   */
  private async validateTenantOwnership(tenantId: number, user: JwtPayload): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (isAdmin) {
      return;
    }

    // Para PARTNER/PARTNER_STAFF, validar ownership
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    if (tenant.partnerId !== userEntity.partnerId) {
      throw new ForbiddenException(
        'You can only access invitation codes from tenants of your partner',
      );
    }
  }
}
