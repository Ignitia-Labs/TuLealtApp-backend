import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreatePartnerRequestHandler,
  CreatePartnerRequestRequest,
  CreatePartnerRequestResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
  RateLimitGuard,
} from '@libs/shared';

/**
 * Controlador de Partner Requests para Partner API
 * Endpoint público para recibir solicitudes de onboarding de partners
 *
 * Endpoints:
 * - POST /partner/public/partner-requests - Crear una solicitud de partner
 */
@ApiTags('Partner Requests')
@Controller('public/partner-requests')
@UseGuards(new RateLimitGuard(5, 3600000)) // 5 requests por hora
export class PartnerRequestsController {
  constructor(private readonly createPartnerRequestHandler: CreatePartnerRequestHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear solicitud de partner',
    description:
      'Endpoint público para crear una nueva solicitud de onboarding de partner. No requiere autenticación. La solicitud se crea con estado "pending" por defecto. Tiene un límite de 5 solicitudes por hora por IP.',
  })
  @ApiBody({
    type: CreatePartnerRequestRequest,
    description: 'Datos de la solicitud de partner',
    examples: {
      solicitudCompleta: {
        summary: 'Solicitud completa',
        description: 'Ejemplo de solicitud con todos los campos',
        value: {
          name: 'Restaurante La Cocina del Sol',
          responsibleName: 'Roberto Méndez',
          email: 'roberto@cocinasol.gt',
          phone: '+502 3333-4444',
          countryId: 1,
          city: 'Antigua Guatemala',
          plan: 'conecta',
          planId: 1,
          billingFrequency: 'monthly',
          logo: 'https://ui-avatars.com/api/?name=Cocina+Sol&background=f97316&color=fff',
          category: 'Restaurantes',
          branchesNumber: 3,
          website: 'https://cocinasol.gt',
          socialMedia: '@cocinadelsolgt',
          rewardType: 'Por monto de compra',
          currencyId: 8,
          businessName: 'La Cocina del Sol S.A.',
          taxId: '12345678-9',
          fiscalAddress: '5ta Avenida Norte #10, Antigua Guatemala',
          paymentMethod: 'Tarjeta de crédito',
          billingEmail: 'facturacion@cocinasol.gt',
          notes: 'Nueva solicitud pendiente de revisión',
        },
      },
      solicitudBasica: {
        summary: 'Solicitud básica',
        description: 'Ejemplo de solicitud con campos mínimos requeridos',
        value: {
          name: 'Mi Negocio',
          responsibleName: 'Juan Pérez',
          email: 'juan@minegocio.com',
          phone: '+502 1234-5678',
          city: 'Ciudad de Guatemala',
          plan: 'esencia',
          category: 'Retail',
          rewardType: 'Por puntos acumulados',
          currencyId: 1,
          businessName: 'Mi Negocio S.A.',
          taxId: '12345678-9',
          fiscalAddress: 'Calle Principal 123',
          paymentMethod: 'Transferencia bancaria',
          billingEmail: 'facturacion@minegocio.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada exitosamente',
    type: CreatePartnerRequestResponse,
    example: {
      id: 1,
      status: 'pending',
      submittedAt: '2024-11-14T09:30:00Z',
      name: 'Restaurante La Cocina del Sol',
      email: 'roberto@cocinasol.gt',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o ya existe una solicitud pendiente o en progreso con ese email',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: 'Ya existe una solicitud pendiente o en progreso con este email',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Límite de solicitudes excedido (rate limit)',
    example: {
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
      error: 'Too Many Requests',
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
  async createPartnerRequest(
    @Body() request: CreatePartnerRequestRequest,
  ): Promise<CreatePartnerRequestResponse> {
    return this.createPartnerRequestHandler.execute(request, 'public');
  }
}
