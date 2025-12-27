import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request DTO para obtener usuarios con roles ADMIN o STAFF
 */
export class GetAdminStaffUsersRequest {
  @ApiProperty({
    description: 'Número de registros a omitir (para paginación)',
    example: 0,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiProperty({
    description: 'Número máximo de registros a retornar',
    example: 50,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number;
}
