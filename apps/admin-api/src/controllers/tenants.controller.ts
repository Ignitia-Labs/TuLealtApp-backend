import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateTenantHandler,
  CreateTenantRequest,
  CreateTenantResponse,
  GetTenantHandler,
  GetTenantRequest,
  GetTenantResponse,
} from '@libs/application';

/**
 * Controlador de tenants para Admin API
 * Permite gestionar tenants del sistema
 *
 * Endpoints:
 * - POST /admin/tenants - Crear un nuevo tenant
 * - GET /admin/tenants/:id - Obtener tenant por ID
 */
@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly createTenantHandler: CreateTenantHandler,
    private readonly getTenantHandler: GetTenantHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo tenant',
    description:
      'Crea un nuevo tenant (negocio) asociado a un partner con sus características configuradas.',
  })
  @ApiBody({
    type: CreateTenantRequest,
    description: 'Datos del tenant a crear',
    examples: {
      ejemplo1: {
        summary: 'Tenant básico',
        description: 'Ejemplo de creación de tenant con datos mínimos',
        value: {
          partnerId: 1,
          name: 'Café Delicia',
          category: 'Cafeterías',
          currencyId: 'currency-8',
          primaryColor: '#ec4899',
          secondaryColor: '#fbbf24',
          description: 'Cafetería gourmet con sabor artesanal',
          pointsExpireDays: 365,
          minPointsToRedeem: 100,
          qrScanning: true,
          offlineMode: true,
          referralProgram: true,
          birthdayRewards: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant creado exitosamente',
    type: CreateTenantResponse,
    example: {
      id: 1,
      partnerId: 1,
      name: 'Café Delicia',
      category: 'Cafeterías',
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: [
        'partnerId must be a number',
        'name should not be empty',
        'primaryColor should not be empty',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Partner no encontrado',
    example: {
      statusCode: 404,
      message: 'Partner with ID 1 not found',
      error: 'Not Found',
    },
  })
  async createTenant(
    @Body() request: CreateTenantRequest,
  ): Promise<CreateTenantResponse> {
    return this.createTenantHandler.execute(request);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tenant por ID',
    description: 'Obtiene la información completa de un tenant por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tenant',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado',
    type: GetTenantResponse,
    example: {
      id: 1,
      partnerId: 1,
      name: 'Café Delicia',
      description: 'Cafetería gourmet con sabor artesanal',
      logo: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
      category: 'Cafeterías',
      currencyId: 'currency-8',
      primaryColor: '#ec4899',
      secondaryColor: '#fbbf24',
      pointsExpireDays: 365,
      minPointsToRedeem: 100,
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
      error: 'Not Found',
    },
  })
  async getTenant(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetTenantResponse> {
    const request = new GetTenantRequest();
    request.tenantId = id;
    return this.getTenantHandler.execute(request);
  }
}
