import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO de request para crear un usuario
 */
export class CreateUserRequest {
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

  @IsString({ each: true })
  roles?: string[];
}
