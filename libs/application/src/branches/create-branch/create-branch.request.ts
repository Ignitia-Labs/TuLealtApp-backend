import { IsNotEmpty, IsString, MinLength, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear una branch
 */
export class CreateBranchRequest {
  @ApiProperty({
    description: 'ID del tenant al que pertenece la branch',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @ApiProperty({
    description: 'Nombre de la branch',
    example: 'Café Delicia - Centro',
    type: String,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Dirección de la branch',
    example: 'Calle Principal 123, Zona 1',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Ciudad de la branch',
    example: 'Guatemala City',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'País de la branch',
    example: 'Guatemala',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Teléfono de la branch',
    example: '+502 1234-5678',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({
    description: 'Email de la branch',
    example: 'centro@cafedelicia.com',
    type: String,
    required: false,
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  email?: string | null;
}
