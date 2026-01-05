import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar una branch
 */
export class DeleteBranchRequest {
  @ApiProperty({
    description: 'ID de la branch a eliminar',
    example: 1,
    type: Number,
  })
  branchId: number;
}
