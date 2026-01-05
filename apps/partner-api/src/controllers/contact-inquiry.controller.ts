import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateContactInquiryHandler,
  CreateContactInquiryRequest,
  CreateContactInquiryResponse,
} from '@libs/application';
import { BadRequestErrorResponseDto, RateLimitGuard } from '@libs/shared';

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
      'Endpoint público para recibir consultas del formulario de contacto. No requiere autenticación.',
  })
  @ApiBody({
    type: CreateContactInquiryRequest,
    description: 'Datos de la consulta de contacto',
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
      request.metadata.language = req.headers['accept-language']?.toString().split(',')[0] || undefined;
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

