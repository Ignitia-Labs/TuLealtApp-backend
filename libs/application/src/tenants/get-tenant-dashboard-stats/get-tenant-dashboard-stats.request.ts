import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/**
 * Request DTO para obtener estadísticas del dashboard de un tenant
 */
export class GetTenantDashboardStatsRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  tenantId: number;
}
