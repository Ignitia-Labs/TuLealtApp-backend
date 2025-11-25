import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de request para autenticar un usuario
 */
export class AuthenticateUserRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
