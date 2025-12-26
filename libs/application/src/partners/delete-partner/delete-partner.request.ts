import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un partner
 */
export class DeletePartnerRequest {
  @ApiProperty({
    description: 'ID del partner a eliminar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  partnerId: number;

  @ApiProperty({
    description: 'ID del usuario que realiza la eliminación (opcional, para auditoría)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  deletedBy?: number | null;
}
