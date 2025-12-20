import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para respuestas de error estándar
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error o array de mensajes de validación',
    example: ['email must be an email', 'name should not be empty'],
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Bad Request',
  })
  error: string;
}

/**
 * DTO para respuestas de error 404
 */
export class NotFoundErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 404,
  })
  statusCode: 404;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Resource not found',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Not Found',
  })
  error: 'Not Found';
}

/**
 * DTO para respuestas de error 401
 */
export class UnauthorizedErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 401,
  })
  statusCode: 401;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Unauthorized',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Unauthorized',
  })
  error: 'Unauthorized';
}

/**
 * DTO para respuestas de error 403
 */
export class ForbiddenErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 403,
  })
  statusCode: 403;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Forbidden resource',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Forbidden',
  })
  error: 'Forbidden';
}

/**
 * DTO para respuestas de error 400
 */
export class BadRequestErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: 400;

  @ApiProperty({
    description: 'Array de mensajes de validación',
    example: ['email must be an email', 'name should not be empty'],
    type: [String],
  })
  message: string[];

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Bad Request',
  })
  error: 'Bad Request';
}

