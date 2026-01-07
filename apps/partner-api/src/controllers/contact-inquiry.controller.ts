import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateContactInquiryHandler,
  CreateContactInquiryRequest,
  CreateContactInquiryResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
  RateLimitGuard,
} from '@libs/shared';

/**
 * Controlador de consultas de contacto para Partner API
 * Endpoint público para recibir consultas del formulario de contacto
 *
 * Endpoints:
 * - POST /partner/public/contact-inquiry - Crear una consulta de contacto
 */
@ApiTags('Contact Inquiry')
@Controller('public/contact-inquiry')
@UseGuards(new RateLimitGuard(5, 3600000)) // 5 requests por hora
export class ContactInquiryController {
  constructor(private readonly createContactInquiryHandler: CreateContactInquiryHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una consulta de contacto',
    description:
      'Endpoint público para recibir consultas del formulario de contacto. No requiere autenticación. Tiene un límite de 5 solicitudes por hora por IP.',
  })
  @ApiBody({
    type: CreateContactInquiryRequest,
    description: 'Datos de la consulta de contacto',
    examples: {
      consultaBasica: {
        summary: 'Consulta básica',
        description: 'Ejemplo de consulta con datos mínimos',
        value: {
          name: 'Juan Pérez',
          email: 'juan@example.com',
          message: 'Me gustaría obtener más información sobre sus servicios.',
        },
      },
      consultaCompleta: {
        summary: 'Consulta completa',
        description: 'Ejemplo de consulta con todos los campos',
        value: {
          name: 'María González',
          email: 'maria@example.com',
          phone: '+502 1234-5678',
          subject: 'Consulta sobre planes de precios',
          message:
            'Me gustaría obtener más información sobre los planes disponibles y sus precios.',
          company: 'Mi Empresa S.A.',
          metadata: {
            source: 'landing-page',
            userAgent: 'Mozilla/5.0...',
            referrer: 'https://example.com',
            language: 'es-GT',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Consulta de contacto creada exitosamente',
    type: CreateContactInquiryResponse,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'received',
      message: 'Su consulta ha sido recibida exitosamente. Nos pondremos en contacto pronto.',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de la consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'name should not be empty',
        'email must be an email',
        'message should not be empty',
        'message must be longer than or equal to 10 characters',
      ],
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
  async createContactInquiry(
    @Body() request: CreateContactInquiryRequest,
    @Req() req: Request,
  ): Promise<CreateContactInquiryResponse> {
    // Agregar metadatos automáticamente si no están presentes
    if (!request.metadata) {
      request.metadata = {};
    }

    // Agregar información del request si está disponible
    if (!request.metadata.userAgent && req.headers['user-agent']) {
      request.metadata.userAgent = req.headers['user-agent'] as string;
    }

    if (!request.metadata.referrer && req.headers.referer) {
      request.metadata.referrer = req.headers.referer;
    }

    if (!request.metadata.language && req.headers['accept-language']) {
      request.metadata.language =
        req.headers['accept-language']?.toString().split(',')[0] || undefined;
    }

    if (!request.metadata.timestamp) {
      request.metadata.timestamp = new Date().toISOString();
    }

    if (!request.metadata.source) {
      request.metadata.source = 'landing-page';
    }

    return this.createContactInquiryHandler.execute(request);
  }
}
