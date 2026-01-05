import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un tenant
 */
export class DeleteTenantRequest {
  @ApiProperty({
    description: 'ID del tenant a eliminar',
    example: 1,
    type: Number,
  })
  tenantId: number;
}
