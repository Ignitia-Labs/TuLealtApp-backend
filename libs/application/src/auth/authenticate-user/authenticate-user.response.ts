import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para autenticar un usuario
 */
export class AuthenticateUserResponse {
  @ApiProperty({
    description: 'Token JWT de autenticación',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3MDUzMjE2MDAsImV4cCI6MTcwNTQwODAwMH0.example',
  })
  token: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    example: {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['ADMIN'],
    },
  })
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
  };

  constructor(token: string, user: { id: number; email: string; name: string; roles: string[] }) {
    this.token = token;
    this.user = user;
  }
}
