import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

/**
 * Request DTO para actualizar la asignación de tenant y branch a un usuario partner
 */
export class UpdatePartnerUserAssignmentRequest {
  @ApiProperty({
    description: 'ID del usuario partner',
    example: 1,
    type: Number,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'ID del tenant a asignar (opcional, null para remover)',
    example: 5,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  tenantId?: number | null;

  @ApiProperty({
    description: 'ID del branch a asignar (opcional, null para remover)',
    example: 10,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  branchId?: number | null;
}
