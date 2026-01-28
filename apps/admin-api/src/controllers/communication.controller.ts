import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Request,
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
  CreateTemplateHandler,
  CreateTemplateRequest,
  CreateTemplateResponse,
  GetTemplatesHandler,
  GetTemplatesRequest,
  GetTemplatesResponse,
  GetTemplateHandler,
  GetTemplateResponse,
  UpdateTemplateHandler,
  UpdateTemplateRequest,
  UpdateTemplateResponse,
  DeleteTemplateHandler,
  DeleteTemplateResponse,
  CreateMessageHandler,
  CreateMessageRequest,
  CreateMessageResponse,
  GetMessagesHandler,
  GetMessagesRequest,
  GetMessagesResponse,
  GetMessageHandler,
  GetMessageResponse,
  GetStatsHandler,
  GetStatsRequest,
  GetStatsResponse,
  UpdateMessageHandler,
  UpdateMessageRequest,
  UpdateMessageResponse,
  DeleteMessageHandler,
  DeleteMessageResponse,
  GetRecipientsHandler,
  GetRecipientsRequest,
  GetRecipientsResponse,
  UpdateRecipientStatusHandler,
  UpdateRecipientStatusRequest,
  UpdateRecipientStatusResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from '@libs/shared';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/shared';

/**
 * Controlador de Comunicaciones para Admin API
 * Permite gestionar plantillas de mensajes y enviar mensajes a partners
 */
@ApiTags('Communication')
@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'WEBMASTER')
@ApiBearerAuth('JWT-auth')
export class CommunicationController {
  constructor(
    // Template Handlers
    private readonly createTemplateHandler: CreateTemplateHandler,
    private readonly getTemplatesHandler: GetTemplatesHandler,
    private readonly getTemplateHandler: GetTemplateHandler,
    private readonly updateTemplateHandler: UpdateTemplateHandler,
    private readonly deleteTemplateHandler: DeleteTemplateHandler,
    // Message Handlers
    private readonly createMessageHandler: CreateMessageHandler,
    private readonly getMessagesHandler: GetMessagesHandler,
    private readonly getMessageHandler: GetMessageHandler,
    private readonly updateMessageHandler: UpdateMessageHandler,
    private readonly deleteMessageHandler: DeleteMessageHandler,
    private readonly getRecipientsHandler: GetRecipientsHandler,
    private readonly updateRecipientStatusHandler: UpdateRecipientStatusHandler,
    private readonly getStatsHandler: GetStatsHandler,
  ) {}

  // ============================================
  // TEMPLATE ENDPOINTS
  // ============================================

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las plantillas de mensajes',
    description: 'Obtiene todas las plantillas con filtros opcionales',
  })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: GetTemplatesResponse })
  async getTemplates(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<GetTemplatesResponse> {
    const request = new GetTemplatesRequest();
    if (type) request.type = type as any;
    if (isActive !== undefined) request.isActive = isActive === 'true' || isActive === '1';
    if (search) request.search = search;
    return this.getTemplatesHandler.execute(request);
  }

  @Get('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una plantilla por ID',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: GetTemplateResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async getTemplate(@Param('id', ParseIntPipe) id: number): Promise<GetTemplateResponse> {
    return this.getTemplateHandler.execute(id);
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva plantilla',
  })
  @ApiResponse({ status: 201, type: CreateTemplateResponse })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async createTemplate(
    @Body() request: CreateTemplateRequest,
    @Request() req: any,
  ): Promise<CreateTemplateResponse> {
    const userId = req.user?.id;
    return this.createTemplateHandler.execute(request, userId);
  }

  @Put('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una plantilla',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: UpdateTemplateResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateTemplateRequest,
  ): Promise<UpdateTemplateResponse> {
    return this.updateTemplateHandler.execute(id, request);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar una plantilla',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: DeleteTemplateResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async deleteTemplate(@Param('id', ParseIntPipe) id: number): Promise<DeleteTemplateResponse> {
    return this.deleteTemplateHandler.execute(id);
  }

  // ============================================
  // MESSAGE ENDPOINTS
  // ============================================

  @Get('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener lista de mensajes',
  })
  @ApiResponse({ status: 200, type: GetMessagesResponse })
  async getMessages(@Query() query: any): Promise<GetMessagesResponse> {
    const request = new GetMessagesRequest();
    if (query.page) request.page = parseInt(query.page, 10);
    if (query.limit) request.limit = parseInt(query.limit, 10);
    if (query.type) request.type = query.type;
    if (query.channel) request.channel = query.channel;
    if (query.status) request.status = query.status;
    if (query.recipientType) request.recipientType = query.recipientType;
    if (query.dateFrom) request.dateFrom = query.dateFrom;
    if (query.dateTo) request.dateTo = query.dateTo;
    if (query.search) request.search = query.search;
    if (query.partnerId) request.partnerId = parseInt(query.partnerId, 10);
    if (query.senderId) request.senderId = parseInt(query.senderId, 10);
    return this.getMessagesHandler.execute(request);
  }

  @Get('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un mensaje por ID',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: GetMessageResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async getMessage(@Param('id', ParseIntPipe) id: number): Promise<GetMessageResponse> {
    return this.getMessageHandler.execute(id);
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear y enviar un mensaje',
  })
  @ApiResponse({ status: 201, type: CreateMessageResponse })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async createMessage(
    @Body() request: CreateMessageRequest,
    @Request() req: any,
  ): Promise<CreateMessageResponse> {
    const senderId = req.user?.id;
    if (!senderId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.createMessageHandler.execute(request, senderId);
  }

  @Put('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un mensaje (solo si está en draft)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: UpdateMessageResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async updateMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateMessageRequest,
  ): Promise<UpdateMessageResponse> {
    return this.updateMessageHandler.execute(id, request);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar un mensaje (solo si está en draft)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: DeleteMessageResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  @ApiResponse({ status: 400, type: BadRequestErrorResponseDto })
  async deleteMessage(@Param('id', ParseIntPipe) id: number): Promise<DeleteMessageResponse> {
    return this.deleteMessageHandler.execute(id);
  }

  @Get('messages/:id/recipients')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener destinatarios de un mensaje',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, type: GetRecipientsResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async getRecipients(
    @Param('id', ParseIntPipe) messageId: number,
    @Query('status') status?: string,
  ): Promise<GetRecipientsResponse> {
    const request = new GetRecipientsRequest();
    if (status) request.status = status as any;
    return this.getRecipientsHandler.execute(messageId, request);
  }

  @Put('messages/:messageId/recipients/:partnerId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de entrega de un destinatario',
    description:
      'Este endpoint puede ser llamado por webhooks de servicios externos (email, SMS, WhatsApp)',
  })
  @ApiParam({ name: 'messageId', type: Number })
  @ApiParam({ name: 'partnerId', type: Number })
  @ApiResponse({ status: 200, type: UpdateRecipientStatusResponse })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async updateRecipientStatus(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Body() request: UpdateRecipientStatusRequest,
  ): Promise<UpdateRecipientStatusResponse> {
    return this.updateRecipientStatusHandler.execute(messageId, partnerId, request);
  }

  // ============================================
  // STATS ENDPOINTS
  // ============================================

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de comunicaciones',
  })
  @ApiResponse({ status: 200, type: GetStatsResponse })
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<GetStatsResponse> {
    const request = new GetStatsRequest();
    if (dateFrom) request.dateFrom = dateFrom;
    if (dateTo) request.dateTo = dateTo;
    return this.getStatsHandler.execute(request);
  }
}
