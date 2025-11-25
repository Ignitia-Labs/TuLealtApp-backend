import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO de request para registrar un usuario
 */
export class RegisterUserRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
