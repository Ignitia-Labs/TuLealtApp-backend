import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para registrar un usuario
 * Si se proporcionan tenantId y registrationBranchId, se creará automáticamente una membership
 */
export class RegisterUserRequest {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'SecurePass123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'ID del tenant para crear automáticamente la membership (opcional)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  tenantId?: number;

  @ApiProperty({
    description: 'ID de la branch donde se registra el customer (opcional)',
    example: 5,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  registrationBranchId?: number;
}
