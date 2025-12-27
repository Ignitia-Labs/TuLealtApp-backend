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
  CreateBranchHandler,
  CreateBranchRequest,
  CreateBranchResponse,
  GetBranchHandler,
  GetBranchRequest,
  GetBranchResponse,
  GetBranchesByTenantHandler,
  GetBranchesByTenantRequest,
  GetBranchesByTenantResponse,
  UpdateBranchHandler,
  UpdateBranchRequest,
  UpdateBranchResponse,
  DeleteBranchHandler,
  DeleteBranchRequest,
  DeleteBranchResponse,
} from '@libs/application';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  InternalServerErrorResponseDto,
  JwtAuthGuard,
} from '@libs/shared';

/**
 * Controlador de branches para Admin API
 * Permite gestionar branches (sucursales) del sistema
 *
 * Endpoints:
 * - GET /admin/branches?tenantId={id} - Listar branches por tenant
 * - POST /admin/branches - Crear una nueva branch
 * - GET /admin/branches/:id - Obtener branch por ID
 * - PATCH /admin/branches/:id - Actualizar branch (actualización parcial)
 * - DELETE /admin/branches/:id - Eliminar branch
 */
@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly createBranchHandler: CreateBranchHandler,
    private readonly getBranchHandler: GetBranchHandler,
    private readonly getBranchesByTenantHandler: GetBranchesByTenantHandler,
    private readonly updateBranchHandler: UpdateBranchHandler,
    private readonly deleteBranchHandler: DeleteBranchHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar branches por tenant',
    description:
      'Obtiene la lista de todas las branches asociadas a un tenant específico. Requiere el parámetro query tenantId.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: true,
    type: Number,
    description: 'ID del tenant para filtrar las branches',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de branches obtenida exitosamente',
    type: GetBranchesByTenantResponse,
    example: {
      branches: [
        {
          id: 1,
          tenantId: 1,
          name: 'Café Delicia - Centro',
          address: 'Calle Principal 123, Zona 1',
          city: 'Guatemala City',
          country: 'Guatemala',
          phone: '+502 1234-5678',
          email: 'centro@cafedelicia.com',
          status: 'active',
          createdAt: '2024-01-05T00:00:00.000Z',
          updatedAt: '2024-01-05T00:00:00.000Z',
        },
        {
          id: 2,
          tenantId: 1,
          name: 'Café Delicia - Zona 10',
          address: 'Avenida Reforma 456, Zona 10',
          city: 'Guatemala City',
          country: 'Guatemala',
          phone: '+502 2345-6789',
          email: 'zona10@cafedelicia.com',
          status: 'active',
          createdAt: '2024-01-10T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['tenantId must be a number', 'tenantId must be greater than or equal to 1'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Tenant with ID 1 not found',
      error: 'Not Found',
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
  async getBranchesByTenant(
    @Query('tenantId', ParseIntPipe) tenantId: number,
  ): Promise<GetBranchesByTenantResponse> {
    const request = new GetBranchesByTenantRequest();
    request.tenantId = tenantId;
    return this.getBranchesByTenantHandler.execute(request);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear una nueva branch',
    description:
      'Crea una nueva branch (sucursal) asociada a un tenant con su información de ubicación.',
  })
  @ApiBody({
    type: CreateBranchRequest,
    description: 'Datos de la branch a crear',
    examples: {
      ejemplo1: {
        summary: 'Branch básica',
        description: 'Ejemplo de creación de branch con datos mínimos',
        value: {
          tenantId: 1,
          name: 'Café Delicia - Centro',
          address: 'Calle Principal 123, Zona 1',
          city: 'Guatemala City',
          country: 'Guatemala',
          phone: '+502 1234-5678',
          email: 'centro@cafedelicia.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Branch creada exitosamente',
    type: CreateBranchResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Café Delicia - Centro',
      address: 'Calle Principal 123, Zona 1',
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
        'tenantId must be a number',
        'name should not be empty',
        'address should not be empty',
      ],
      error: 'Bad Request',
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
  async createBranch(@Body() request: CreateBranchRequest): Promise<CreateBranchResponse> {
    return this.createBranchHandler.execute(request);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener branch por ID',
    description: 'Obtiene la información completa de una branch por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la branch',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Branch encontrada',
    type: GetBranchResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Café Delicia - Centro',
      address: 'Calle Principal 123, Zona 1',
      city: 'Guatemala City',
      country: 'Guatemala',
      phone: '+502 1234-5678',
      email: 'centro@cafedelicia.com',
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Branch no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Branch with ID 1 not found',
      error: 'Not Found',
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
  async getBranch(@Param('id', ParseIntPipe) id: number): Promise<GetBranchResponse> {
    const request = new GetBranchRequest();
    request.branchId = id;
    return this.getBranchHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar branch',
    description:
      'Actualiza una branch existente. Todos los campos son opcionales, solo se actualizarán los campos enviados (actualización parcial PATCH).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la branch a actualizar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateBranchRequest,
    description: 'Datos de la branch a actualizar (todos los campos son opcionales)',
    examples: {
      ejemplo1: {
        summary: 'Actualizar solo nombre y dirección',
        description: 'Ejemplo de actualización parcial de solo algunos campos',
        value: {
          name: 'Café Delicia - Centro Renovado',
          address: 'Calle Principal 456, Zona 1',
        },
      },
      ejemplo2: {
        summary: 'Actualizar contacto',
        description: 'Ejemplo de actualización de información de contacto',
        value: {
          phone: '+502 9876-5432',
          email: 'nuevo@cafedelicia.com',
        },
      },
      ejemplo3: {
        summary: 'Cerrar branch',
        description: 'Ejemplo de cierre de branch cambiando su estado',
        value: {
          status: 'closed',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Branch actualizada exitosamente',
    type: UpdateBranchResponse,
    example: {
      id: 1,
      tenantId: 1,
      name: 'Café Delicia - Centro Renovado',
      address: 'Calle Principal 456, Zona 1',
      city: 'Guatemala City',
      country: 'Guatemala',
      phone: '+502 9876-5432',
      email: 'nuevo@cafedelicia.com',
      status: 'active',
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    type: BadRequestErrorResponseDto,
    example: {
      statusCode: 400,
      message: [
        'name must be longer than or equal to 2 characters',
        'status must be one of the following values: active, inactive, closed',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Branch no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Branch with ID 1 not found',
      error: 'Not Found',
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
  async updateBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateBranchRequest,
  ): Promise<UpdateBranchResponse> {
    return this.updateBranchHandler.execute(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar branch',
    description: 'Elimina una branch del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la branch a eliminar',
    type: Number,
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Branch eliminada exitosamente',
    type: DeleteBranchResponse,
    example: {
      message: 'Branch deleted successfully',
      id: 1,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    type: UnauthorizedErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos suficientes',
    type: ForbiddenErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Branch no encontrada',
    type: NotFoundErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Branch with ID 1 not found',
      error: 'Not Found',
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
  async deleteBranch(@Param('id', ParseIntPipe) id: number): Promise<DeleteBranchResponse> {
    const request = new DeleteBranchRequest();
    request.branchId = id;
    return this.deleteBranchHandler.execute(request);
  }
}
