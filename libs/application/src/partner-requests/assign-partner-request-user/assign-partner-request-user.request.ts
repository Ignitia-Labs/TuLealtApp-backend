import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

/**
 * Request DTO para asignar un usuario a una solicitud de partner
 */
export class AssignPartnerRequestUserRequest {
  @ApiProperty({
    description: 'ID de la solicitud de partner',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  requestId: number;

  @ApiProperty({
    description: 'ID del usuario a asignar (debe tener rol ADMIN o STAFF)',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
