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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  CreatePartnerHandler,
  CreatePartnerRequest,
  CreatePartnerResponse,
  GetPartnerHandler,
  GetPartnerRequest,
  GetPartnerResponse,
} from '@libs/application';

/**
 * Controlador de partners para Admin API
 * Permite gestionar partners del sistema
 *
 * Endpoints:
 * - POST /admin/partners - Crear un nuevo partner
 * - GET /admin/partners/:id - Obtener partner por ID
 */
@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly createPartnerHandler: CreatePartnerHandler,
    private readonly getPartnerHandler: GetPartnerHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo partner',
    description:
      'Crea un nuevo partner en el sistema con sus datos básicos, suscripción, límites y estadísticas iniciales.',
  })
  @ApiBody({
    type: CreatePartnerRequest,
    description: 'Datos del partner a crear',
    examples: {
      ejemplo1: {
        summary: 'Partner básico',
        description: 'Ejemplo de creación de partner con datos mínimos',
        value: {
          name: 'Grupo Comercial ABC',
          responsibleName: 'María González',
          email: 'maria@abc-comercial.com',
          phone: '+502 2345-6789',
          country: 'Guatemala',
          city: 'Ciudad de Guatemala',
          plan: 'conecta',
          category: 'Retail',
          rewardType: 'Por monto de compra',
          currencyId: 'currency-8',
          businessName: 'Grupo Comercial ABC S.A. de C.V.',
          taxId: 'RFC-ABC-123456',
          fiscalAddress: 'Zona 10, Guatemala City, Guatemala',
          paymentMethod: 'Tarjeta de crédito',
          billingEmail: 'facturacion@abc-comercial.com',
          domain: 'abc-comercial.com',
          subscriptionPlanId: 'plan-conecta',
          subscriptionStartDate: '2024-01-01T00:00:00Z',
          subscriptionRenewalDate: '2025-01-01T00:00:00Z',
          subscriptionLastPaymentAmount: 99.0,
          subscriptionAutoRenew: true,
          limitsMaxTenants: 5,
          limitsMaxBranches: 20,
          limitsMaxCustomers: 5000,
          limitsMaxRewards: 50,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Partner creado exitosamente',
    type: CreatePartnerResponse,
    example: {
      id: 1,
      name: 'Grupo Comercial ABC',
      email: 'maria@abc-comercial.com',
      domain: 'abc-comercial.com',
      plan: 'conecta',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: ['email must be an email', 'name should not be empty', 'domain should not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El partner ya existe (email o dominio duplicado)',
    example: {
      statusCode: 409,
      message: 'Partner with this email already exists',
      error: 'Conflict',
    },
  })
  async createPartner(@Body() request: CreatePartnerRequest): Promise<CreatePartnerResponse> {
    return this.createPartnerHandler.execute(request);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener partner por ID',
    description: 'Obtiene la información completa de un partner por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del partner',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Partner encontrado',
    type: GetPartnerResponse,
    example: {
      id: 1,
      name: 'Grupo Comercial ABC',
      responsibleName: 'María González',
      email: 'maria@abc-comercial.com',
      phone: '+502 2345-6789',
      country: 'Guatemala',
      city: 'Ciudad de Guatemala',
      plan: 'conecta',
      logo: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
      category: 'Retail',
      branchesNumber: 5,
      website: 'https://abc-comercial.com',
      socialMedia: '@abccomercial',
      rewardType: 'Por monto de compra',
      currencyId: 'currency-8',
      businessName: 'Grupo Comercial ABC S.A. de C.V.',
      taxId: 'RFC-ABC-123456',
      fiscalAddress: 'Zona 10, Guatemala City, Guatemala',
      paymentMethod: 'Tarjeta de crédito',
      billingEmail: 'facturacion@abc-comercial.com',
      domain: 'abc-comercial.com',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-11-01T00:00:00.000Z',
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
  async getPartner(@Param('id', ParseIntPipe) id: number): Promise<GetPartnerResponse> {
    const request = new GetPartnerRequest();
    request.partnerId = id;
    return this.getPartnerHandler.execute(request);
  }
}
