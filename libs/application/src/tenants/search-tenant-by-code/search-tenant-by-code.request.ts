import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para buscar un tenant por código
 */
export class SearchTenantByCodeRequest {
  @ApiProperty({
    description: 'Código de búsqueda rápida del tenant',
    example: 'TENANT-ABC234',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
