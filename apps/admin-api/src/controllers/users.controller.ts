import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  CreateUserHandler,
  CreateUserRequest,
  CreateUserResponse,
  GetUserProfileHandler,
  GetUserProfileRequest,
  GetUserProfileResponse,
  LockUserHandler,
  LockUserRequest,
  LockUserResponse,
  UpdateUserProfileHandler,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from '@libs/application';

/**
 * Controlador de usuarios para Admin API
 * Capa delgada que solo delega a los handlers de aplicación
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly getUserProfileHandler: GetUserProfileHandler,
    private readonly lockUserHandler: LockUserHandler,
    private readonly updateUserProfileHandler: UpdateUserProfileHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserRequest })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: CreateUserResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567890',
      profile: { preferences: { language: 'es', notifications: true } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  })
  async createUser(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.createUserHandler.execute(request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil de usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario encontrado',
    type: GetUserProfileResponse,
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      profile: { preferences: { language: 'es', theme: 'light' } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  async getUserProfile(@Param('id', ParseIntPipe) id: number): Promise<GetUserProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = id;
    return this.getUserProfileHandler.execute(request);
  }

  @Patch(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloquear un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a bloquear', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Usuario bloqueado exitosamente',
    type: LockUserResponse,
    example: {
      id: 1,
      isActive: false,
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  async lockUser(@Param('id', ParseIntPipe) id: number): Promise<LockUserResponse> {
    const request = new LockUserRequest();
    request.userId = id;
    return this.lockUserHandler.execute(request);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar perfil de usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar', type: Number, example: 1 })
  @ApiBody({ type: UpdateUserProfileRequest })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario actualizado exitosamente',
    type: UpdateUserProfileResponse,
    example: {
      id: 1,
      email: 'updated@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+9876543210',
      profile: { preferences: { language: 'en', theme: 'dark' } },
      roles: ['CUSTOMER'],
      isActive: true,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-20T14:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<UpdateUserProfileRequest>,
  ): Promise<UpdateUserProfileResponse> {
    const request = new UpdateUserProfileRequest();
    request.userId = id;
    request.email = body.email;
    request.firstName = body.firstName;
    request.lastName = body.lastName;
    request.phone = body.phone;
    request.profile = body.profile;
    return this.updateUserProfileHandler.execute(request);
  }
}
