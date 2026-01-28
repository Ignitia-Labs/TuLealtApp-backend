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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateGoalHandler,
  CreateGoalRequest,
  CreateGoalResponse,
  GetGoalHandler,
  GetGoalRequest,
  GetGoalResponse,
  GetGoalsHandler,
  GetGoalsRequest,
  GetGoalsResponse,
  UpdateGoalHandler,
  UpdateGoalRequest,
  UpdateGoalResponse,
  DeleteGoalHandler,
  DeleteGoalRequest,
  DeleteGoalResponse,
  GetGoalProgressHandler,
  GetGoalProgressRequest,
  GetGoalProgressResponse,
} from '@libs/application';
import {
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de metas para Admin API
 * Permite gestionar metas de suscripciones
 */
@ApiTags('Goals')
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly createGoalHandler: CreateGoalHandler,
    private readonly getGoalHandler: GetGoalHandler,
    private readonly getGoalsHandler: GetGoalsHandler,
    private readonly updateGoalHandler: UpdateGoalHandler,
    private readonly deleteGoalHandler: DeleteGoalHandler,
    private readonly getGoalProgressHandler: GetGoalProgressHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener todas las metas',
    description: 'Obtiene una lista paginada de todas las metas',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Solo obtener metas activas',
    example: true,
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
    description: 'Cantidad de elementos por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de metas obtenida exitosamente',
    type: GetGoalsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  async getGoals(@Query() query: GetGoalsRequest): Promise<GetGoalsResponse> {
    return this.getGoalsHandler.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear una nueva meta',
    description: 'Crea una nueva meta de suscripción',
  })
  @ApiBody({
    type: CreateGoalRequest,
    description: 'Datos de la meta a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Meta creada exitosamente',
    type: CreateGoalResponse,
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
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  async createGoal(@Body() request: CreateGoalRequest): Promise<CreateGoalResponse> {
    return this.createGoalHandler.execute(request);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener meta por ID',
    description: 'Obtiene los detalles de una meta específica con cálculo de progreso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Meta encontrada',
    type: GetGoalResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Meta no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  async getGoal(@Param('id', ParseIntPipe) id: number): Promise<GetGoalResponse> {
    const request = new GetGoalRequest();
    request.goalId = id;
    return this.getGoalHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar meta',
    description: 'Actualiza una meta existente (actualización parcial)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateGoalRequest,
    description: 'Datos a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Meta actualizada exitosamente',
    type: UpdateGoalResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Meta no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  async updateGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateGoalRequest,
  ): Promise<UpdateGoalResponse> {
    request.goalId = id;
    return this.updateGoalHandler.execute(request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar meta',
    description: 'Elimina una meta del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Meta eliminada exitosamente',
    type: DeleteGoalResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Meta no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  async deleteGoal(@Param('id', ParseIntPipe) id: number): Promise<DeleteGoalResponse> {
    const request = new DeleteGoalRequest();
    request.goalId = id;
    return this.deleteGoalHandler.execute(request);
  }

  @Get(':id/progress')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener progreso detallado de una meta',
    description: 'Obtiene información detallada del progreso, proyección y tendencia de una meta',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la meta',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso obtenido exitosamente',
    type: GetGoalProgressResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Meta no encontrada',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
    type: ForbiddenErrorResponseDto,
  })
  async getGoalProgress(@Param('id', ParseIntPipe) id: number): Promise<GetGoalProgressResponse> {
    const request = new GetGoalProgressRequest();
    request.goalId = id;
    return this.getGoalProgressHandler.execute(request);
  }
}
