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
  CreateBranchHandler,
  CreateBranchRequest,
  CreateBranchResponse,
  GetBranchHandler,
  GetBranchRequest,
  GetBranchResponse,
} from '@libs/application';

/**
 * Controlador de branches para Admin API
 * Permite gestionar branches (sucursales) del sistema
 *
 * Endpoints:
 * - POST /admin/branches - Crear una nueva branch
 * - GET /admin/branches/:id - Obtener branch por ID
 */
@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly createBranchHandler: CreateBranchHandler,
    private readonly getBranchHandler: GetBranchHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
    example: {
      statusCode: 404,
      message: 'Branch with ID 1 not found',
      error: 'Not Found',
    },
  })
  async getBranch(@Param('id', ParseIntPipe) id: number): Promise<GetBranchResponse> {
    const request = new GetBranchRequest();
    request.branchId = id;
    return this.getBranchHandler.execute(request);
  }
}
