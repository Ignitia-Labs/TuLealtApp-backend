import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  SearchTenantByCodeHandler,
  SearchTenantByCodeRequest,
  SearchTenantByCodeResponse,
} from '@libs/application';
import { NotFoundErrorResponseDto } from '@libs/shared';

/**
 * Controlador público de búsqueda de tenants
 * Permite buscar información pública de un tenant y sus programas activos
 * No requiere autenticación - endpoint público
 */
@ApiTags('Tenant Search')
@Controller('tenant-search')
export class TenantSearchController {
  constructor(private readonly searchTenantByCodeHandler: SearchTenantByCodeHandler) {}

  @Get(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar tenant por código',
    description:
      'Busca un tenant por su código de búsqueda rápida y retorna información pública del tenant y sus programas activos. ' +
      'Este endpoint es público y no requiere autenticación. ' +
      'Permite al usuario explorar tenants antes de registrarse o enrollarse.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Código de búsqueda rápida del tenant (case-insensitive)',
    example: 'TENANT-ABC234',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado con sus programas activos',
    type: SearchTenantByCodeResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant no encontrado o no activo',
    type: NotFoundErrorResponseDto,
  })
  async searchTenantByCode(@Param('code') code: string): Promise<SearchTenantByCodeResponse> {
    const request = new SearchTenantByCodeRequest();
    request.code = code;

    return this.searchTenantByCodeHandler.execute(request);
  }
}
