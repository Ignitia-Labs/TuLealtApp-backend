import { IsNumber, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar el estado de una solicitud de partner
 */
export class UpdatePartnerRequestStatusRequest {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  @IsNumber()
  requestId: number;

  @ApiProperty({
    description: 'Nuevo estado de la solicitud',
    example: 'in-progress',
    enum: ['pending', 'in-progress', 'enrolled', 'rejected'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'in-progress', 'enrolled', 'rejected'])
  status: 'pending' | 'in-progress' | 'enrolled' | 'rejected';

  @ApiProperty({
    description: 'ID del usuario que asigna la solicitud (requerido si status es in-progress)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  assignedTo?: number;
}
