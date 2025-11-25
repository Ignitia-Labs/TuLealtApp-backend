import { Controller, Get, Post, Patch, Body, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
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
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserRequest })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: CreateUserResponse,
  })
  async createUser(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.createUserHandler.execute(request);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil de usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario encontrado',
    type: GetUserProfileResponse,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserProfile(@Param('id', ParseIntPipe) id: number): Promise<GetUserProfileResponse> {
    const request = new GetUserProfileRequest();
    request.userId = id;
    return this.getUserProfileHandler.execute(request);
  }

  @Patch(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloquear un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a bloquear', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Usuario bloqueado exitosamente',
    type: LockUserResponse,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async lockUser(@Param('id', ParseIntPipe) id: number): Promise<LockUserResponse> {
    const request = new LockUserRequest();
    request.userId = id;
    return this.lockUserHandler.execute(request);
  }
}
