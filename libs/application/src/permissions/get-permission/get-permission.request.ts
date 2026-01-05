import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

/**
 * DTO de request para obtener un permiso
 */
export class GetPermissionRequest {
  @ApiProperty({
    description: 'ID único del permiso (opcional si se proporciona code)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  permissionId?: number;

  @ApiProperty({
    description: 'Código único del permiso (opcional si se proporciona permissionId)',
    example: 'admin.users.create',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;
}
