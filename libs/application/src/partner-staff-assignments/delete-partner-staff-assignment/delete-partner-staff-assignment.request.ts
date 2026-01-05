import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

/**
 * Request DTO para eliminar una asignación staff-partner
 */
export class DeletePartnerStaffAssignmentRequest {
  @ApiProperty({
    description: 'ID de la asignación a eliminar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
