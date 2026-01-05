import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserRequest } from '../create-user/create-user.request';

/**
 * DTO de request para crear un usuario PARTNER
 * Extiende CreateUserRequest y agrega partnerId requerido
 */
export class CreatePartnerUserRequest extends CreateUserRequest {
  @ApiProperty({
    description: 'ID del partner al que pertenece el usuario',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  partnerId: number;
}
