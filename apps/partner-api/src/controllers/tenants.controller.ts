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
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTenantHandler,
  CreateTenantRequest,
  CreateTenantResponse,
  GetTenantHandler,
  GetTenantRequest,
  GetTenantResponse,
  GetTenantsByPartnerHandler,
  GetTenantsByPartnerRequest,
  GetTenantsByPartnerResponse,
  UpdateTenantHandler,
  UpdateTenantRequest,
  UpdateTenantResponse,
  DeleteTenantHandler,
  DeleteTenantRequest,
  DeleteTenantResponse,
  GetTenantDashboardStatsHandler,
  GetTenantDashboardStatsRequest,
  GetTenantDashboardStatsResponse,
  GetTenantPointsTransactionsHandler,
  GetTenantPointsTransactionsRequest,
  GetTenantPointsTransactionsResponse,
  JwtPayload,
} from '@libs/application';
import { IUserRepository, ITenantRepository, IPricingPlanRepository } from '@libs/domain';
import {
  ImageOptimizerService,
  PartnerSubscriptionEntity,
  PartnerSubscriptionUsageEntity,
  S3Service,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
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
import { extname } from 'path';
import { randomUUID } from 'crypto';

// Tipo para archivos subidos con Multer
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
  stream?: NodeJS.ReadableStream;
};

/**
 * Controlador de tenants para Partner API
 * Permite gestionar tenants del partner autenticado
 *
 * Endpoints:
 * - GET /partner/tenants - Listar todos los tenants del partner autenticado
 * - GET /partner/tenants/:id - Obtener tenant por ID (validando ownership)
 * - POST /partner/tenants - Crear nuevo tenant para el partner autenticado
 * - PATCH /partner/tenants/:id - Actualizar tenant (validando ownership)
 * - DELETE /partner/tenants/:id - Eliminar tenant (validando ownership)
 * - POST /partner/tenants/:id/logo - Subir logo del tenant
 * - DELETE /partner/tenants/:id/logo - Eliminar logo del tenant
 * - POST /partner/tenants/:id/banner - Subir banner del tenant
 * - DELETE /partner/tenants/:id/banner - Eliminar banner del tenant
 */
@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
@Roles('PARTNER', 'PARTNER_STAFF', 'ADMIN', 'ADMIN_STAFF')
@ApiBearerAuth('JWT-auth')
export class TenantsController {
  constructor(
    private readonly createTenantHandler: CreateTenantHandler,
    private readonly getTenantHandler: GetTenantHandler,
    private readonly getTenantsByPartnerHandler: GetTenantsByPartnerHandler,
    private readonly updateTenantHandler: UpdateTenantHandler,
    private readonly deleteTenantHandler: DeleteTenantHandler,
    private readonly getTenantDashboardStatsHandler: GetTenantDashboardStatsHandler,
    private readonly getTenantPointsTransactionsHandler: GetTenantPointsTransactionsHandler,
    private readonly s3Service: S3Service,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IPricingPlanRepository')
    private readonly pricingPlanRepository: IPricingPlanRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
    private readonly imageOptimizerService: ImageOptimizerService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar tenants del partner autenticado',
    description:
      'Obtiene la lista de todos los tenants asociados al partner del usuario autenticado. El usuario debe tener rol PARTNER, PARTNER_STAFF, ADMIN o ADMIN_STAFF.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tenants obtenida exitosamente',
    type: GetTenantsByPartnerResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos',
    type: ForbiddenErrorResponseDto,
  })
  async getTenants(@CurrentUser() user: JwtPayload): Promise<GetTenantsByPartnerResponse> {
    // Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier partner (pero necesitan partnerId en query)
    // Para PARTNER/PARTNER_STAFF, usar su propio partnerId
    const request = new GetTenantsByPartnerRequest();
    request.partnerId = userEntity.partnerId;

    return this.getTenantsByPartnerHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener tenant por ID',
    description:
      'Obtiene la información de un tenant específico. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant obtenido exitosamente',
    type: GetTenantResponse,
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
  async getTenant(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<GetTenantResponse> {
    const request = new GetTenantRequest();
    request.tenantId = id;

    return this.getTenantHandler.execute(request);
  }

  @Get(':id/dashboard/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas del dashboard de un tenant',
    description:
      'Obtiene estadísticas agregadas del tenant para visualización en dashboard: métricas de customers, puntos, redemptions, top rewards, top customers y transacciones recientes. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    type: GetTenantDashboardStatsResponse,
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
  async getTenantDashboardStats(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<GetTenantDashboardStatsResponse> {
    const request = new GetTenantDashboardStatsRequest();
    request.tenantId = id;

    return this.getTenantDashboardStatsHandler.execute(request);
  }

  @Get(':id/loyalty/points-transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener transacciones de puntos de un tenant',
    description:
      'Obtiene las transacciones de puntos de un tenant con paginación y filtros. Útil para AdvancedAnalytics. El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['EARNING', 'REDEEM', 'ADJUSTMENT', 'REVERSAL', 'EXPIRATION', 'all'],
    description: 'Tipo de transacción a filtrar',
    example: 'EARNING',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Transacciones obtenidas exitosamente',
    type: GetTenantPointsTransactionsResponse,
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
  async getTenantPointsTransactions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<GetTenantPointsTransactionsResponse> {
    const request = new GetTenantPointsTransactionsRequest();
    request.tenantId = id;
    if (type) {
      request.type = type as any;
    }
    if (fromDate) {
      request.fromDate = fromDate;
    }
    if (toDate) {
      request.toDate = toDate;
    }
    if (page) {
      request.page = parseInt(page, 10);
    }
    if (limit) {
      request.limit = parseInt(limit, 10);
    }

    return this.getTenantPointsTransactionsHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo tenant',
    description:
      'Crea un nuevo tenant para el partner del usuario autenticado. Valida que el partner no haya excedido el límite de tenants permitidos por su plan.',
  })
  @ApiBody({
    type: CreateTenantRequest,
    description: 'Datos del tenant a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant creado exitosamente',
    type: CreateTenantResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o límite de tenants excedido',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos',
    type: ForbiddenErrorResponseDto,
  })
  async createTenant(
    @Body() request: CreateTenantRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateTenantResponse> {
    // 1. Obtener partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity || !userEntity.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }
    const partnerId = userEntity.partnerId;

    // 2. Obtener límites del plan desde pricing_plan_limits
    const planLimits = await SubscriptionUsageHelper.getPlanLimitsForPartner(
      partnerId,
      this.subscriptionRepository,
      this.pricingPlanRepository,
    );

    if (!planLimits) {
      throw new NotFoundException(
        `Pricing plan limits not found for partner with ID ${partnerId}. Please ensure the partner has an active subscription.`,
      );
    }

    // 3. Obtener uso actual desde subscription_usage
    const usage = await SubscriptionUsageHelper.getCurrentUsageForPartner(
      partnerId,
      this.subscriptionRepository,
      this.usageRepository,
    );

    // 4. Validar límites usando el método de dominio
    if (!planLimits.canCreateTenant(usage.tenantsCount)) {
      throw new BadRequestException(
        `Maximum number of tenants reached for your plan. Current: ${usage.tenantsCount}, Maximum: ${planLimits.maxTenants === -1 ? 'unlimited' : planLimits.maxTenants}`,
      );
    }

    // 5. Asignar partnerId al request y crear tenant
    request.partnerId = partnerId;
    return this.createTenantHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar tenant',
    description:
      'Actualiza un tenant existente. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF). Permite actualización parcial (PATCH).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiBody({
    type: UpdateTenantRequest,
    description: 'Datos del tenant a actualizar (campos opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant actualizado exitosamente',
    type: UpdateTenantResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
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
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async updateTenant(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateTenantRequest,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<UpdateTenantResponse> {
    return this.updateTenantHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar tenant',
    description:
      'Elimina un tenant existente. El tenant debe pertenecer al partner del usuario autenticado (o el usuario debe ser ADMIN/ADMIN_STAFF).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant eliminado exitosamente',
    type: DeleteTenantResponse,
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
  async deleteTenant(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _user: JwtPayload, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<DeleteTenantResponse> {
    const request = new DeleteTenantRequest();
    request.tenantId = id;

    return this.deleteTenantHandler.execute(request);
  }

  @Post(':id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir logo del tenant',
    description:
      'Sube una imagen que se almacenará en S3 y actualiza el logo del tenant. El tenant debe pertenecer al partner del usuario autenticado. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, webp)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo subido y actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/tenants/xyz789-logo.png',
          description: 'URL pública del logo subido',
        },
        tenant: {
          type: 'object',
          description: 'Tenant actualizado con el nuevo logo',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido, formato no permitido o tamaño excedido',
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
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async uploadTenantLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: MulterFile,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ url: string; tenant: UpdateTenantResponse }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format. Only jpg, jpeg, png, webp are allowed');
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ADMIN_STAFF');
    if (!isAdmin && user) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId || tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only upload logos for tenants from your partner');
      }
    }

    try {
      // Obtener logo anterior si existe para eliminarlo después
      const oldLogoUrl = tenant.logo;

      const optimized = await this.imageOptimizerService.optimize(file);
      const ext = extname(optimized.originalname).toLowerCase(); // ".png", ".jpg", etc.
      const random = randomUUID().slice(0, 12); // corto pero único
      const fileName = `logo-${id}-${random}${ext}`;

      // Subir nuevo logo a S3
      const url = await this.s3Service.uploadFile(optimized, 'tenants', fileName);

      // Actualizar tenant con el nuevo logo
      const updateRequest = new UpdateTenantRequest();
      updateRequest.logo = url;
      const updatedTenant = await this.updateTenantHandler.execute(id, updateRequest);

      // Eliminar logo anterior de S3 si existe
      if (oldLogoUrl) {
        try {
          const oldLogoKey = this.s3Service.extractKeyFromUrl(oldLogoUrl);
          await this.s3Service.deleteFile(oldLogoKey);
        } catch (error) {
          // Log el error pero no fallar la operación si no se puede eliminar el logo anterior
          console.warn(`Failed to delete old logo: ${error.message}`);
        }
      }

      return { url, tenant: updatedTenant };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Delete(':id/logo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar logo del tenant',
    description:
      'Elimina el logo del tenant (tanto de S3 como de la base de datos). El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Logo eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logo deleted successfully',
        },
        tenant: {
          type: 'object',
          description: 'Tenant actualizado sin logo',
        },
      },
    },
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
    description: 'Tenant no encontrado o no tiene logo',
    type: NotFoundErrorResponseDto,
  })
  async deleteTenantLogo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string; tenant: UpdateTenantResponse }> {
    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (!tenant.logo) {
      throw new NotFoundException(`Tenant with ID ${id} does not have a logo`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId || tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only delete logos from tenants of your partner');
      }
    }

    try {
      // Extraer clave del logo en S3
      const logoKey = this.s3Service.extractKeyFromUrl(tenant.logo);

      // Eliminar logo de S3
      await this.s3Service.deleteFile(logoKey);

      // Actualizar tenant eliminando el logo
      const updateRequest = new UpdateTenantRequest();
      updateRequest.logo = null;
      const updatedTenant = await this.updateTenantHandler.execute(id, updateRequest);

      return {
        message: 'Logo deleted successfully',
        tenant: updatedTenant,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete logo: ${error.message}`);
    }
  }

  @Post(':id/banner')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir banner del tenant',
    description:
      'Sube una imagen de banner que se almacenará en S3 y actualiza el banner del tenant. El tenant debe pertenecer al partner del usuario autenticado. Formatos permitidos: jpg, jpeg, png, webp. Tamaño máximo: 5MB.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, webp)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Banner subido y actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'http://localhost:9000/tulealtapp-images/tenants/xyz789-banner.png',
          description: 'URL pública del banner subido',
        },
        tenant: {
          type: 'object',
          description: 'Tenant actualizado con el nuevo banner',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido, formato no permitido o tamaño excedido',
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
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async uploadTenantBanner(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: MulterFile,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ url: string; tenant: UpdateTenantResponse }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format. Only jpg, jpeg, png, webp are allowed');
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ADMIN_STAFF');
    if (!isAdmin && user) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId || tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only upload banners for tenants from your partner');
      }
    }

    try {
      // Obtener banner anterior si existe para eliminarlo después
      const oldBannerUrl = tenant.banner;

      const optimized = await this.imageOptimizerService.optimize(file);
      const ext = extname(optimized.originalname).toLowerCase(); // ".png", ".jpg", etc.
      const random = randomUUID().slice(0, 12); // corto pero único
      const fileName = `banner-${id}-${random}${ext}`;

      // Subir nuevo banner a S3
      const url = await this.s3Service.uploadFile(optimized, 'tenants', fileName);

      // Actualizar tenant con el nuevo banner
      const updateRequest = new UpdateTenantRequest();
      updateRequest.banner = url;
      const updatedTenant = await this.updateTenantHandler.execute(id, updateRequest);

      // Eliminar banner anterior de S3 si existe
      if (oldBannerUrl) {
        try {
          const oldBannerKey = this.s3Service.extractKeyFromUrl(oldBannerUrl);
          await this.s3Service.deleteFile(oldBannerKey);
        } catch (error) {
          // Log el error pero no fallar la operación si no se puede eliminar el banner anterior
          console.warn(`Failed to delete old banner: ${error.message}`);
        }
      }

      return { url, tenant: updatedTenant };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Delete(':id/banner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar banner del tenant',
    description:
      'Elimina el banner del tenant (tanto de S3 como de la base de datos). El tenant debe pertenecer al partner del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del tenant',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Banner eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Banner deleted successfully',
        },
        tenant: {
          type: 'object',
          description: 'Tenant actualizado sin banner',
        },
      },
    },
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
    description: 'Tenant no encontrado o no tiene banner',
    type: NotFoundErrorResponseDto,
  })
  async deleteTenantBanner(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string; tenant: UpdateTenantResponse }> {
    // Validar ownership del tenant
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    if (!tenant.banner) {
      throw new NotFoundException(`Tenant with ID ${id} does not have a banner`);
    }

    // Para ADMIN/ADMIN_STAFF, permitir acceso a cualquier recurso
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('ADMIN_STAFF');
    if (!isAdmin) {
      const userEntity = await this.userRepository.findById(user.userId);
      if (!userEntity || !userEntity.partnerId || tenant.partnerId !== userEntity.partnerId) {
        throw new ForbiddenException('You can only delete banners from tenants of your partner');
      }
    }

    try {
      // Extraer clave del banner en S3
      const bannerKey = this.s3Service.extractKeyFromUrl(tenant.banner);

      // Eliminar banner de S3
      await this.s3Service.deleteFile(bannerKey);

      // Actualizar tenant eliminando el banner
      const updateRequest = new UpdateTenantRequest();
      updateRequest.banner = null;
      const updatedTenant = await this.updateTenantHandler.execute(id, updateRequest);

      return {
        message: 'Banner deleted successfully',
        tenant: updatedTenant,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete banner: ${error.message}`);
    }
  }
}
