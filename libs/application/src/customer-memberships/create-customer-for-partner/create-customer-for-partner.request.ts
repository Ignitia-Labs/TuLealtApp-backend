import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * DTO de request para crear un customer desde Partner API
 */
export class CreateCustomerForPartnerRequest {
  @ApiProperty({
    description: 'Email del customer',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nombre completo del customer',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Nombre del customer',
    example: 'John',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del customer',
    example: 'Doe',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'Teléfono del customer',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Contraseña del customer',
    example: 'SecurePass123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'ID del tenant donde se creará la membership',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;

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

  @ApiProperty({
    description: 'Puntos iniciales (opcional, por defecto 0)',
    example: 0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  points?: number;

  @ApiProperty({
    description: 'Estado inicial (opcional, por defecto active)',
    example: 'active',
    enum: ['active', 'inactive'],
    required: false,
  })
  @IsOptional()
  status?: 'active' | 'inactive';
}
