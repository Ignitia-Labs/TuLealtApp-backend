import { IsOptional, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type CustomerLoyaltyProgramStatusFilter = 'active' | 'inactive' | 'all';

export class GetCustomerLoyaltyProgramsRequest {
  @ApiProperty({ example: 100, description: 'ID de la membership' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId: number;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filtrar por status del programa',
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'all'])
  status?: CustomerLoyaltyProgramStatusFilter;

  @ApiProperty({
    example: 'all',
    enum: ['true', 'false', 'all'],
    required: false,
    description: 'Filtrar por si está inscrito',
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['true', 'false', 'all'])
  enrolled?: 'true' | 'false' | 'all';
}
