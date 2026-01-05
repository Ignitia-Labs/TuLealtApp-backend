import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO de request para eliminar un permiso
 */
export class DeletePermissionRequest {
  @ApiProperty({
    description: 'ID único del permiso a eliminar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}
