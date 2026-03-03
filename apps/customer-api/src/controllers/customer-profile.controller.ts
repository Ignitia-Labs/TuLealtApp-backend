import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import {
  PatchCustomerProfileHandler,
  PatchCustomerProfileRequest,
  UpdateMyProfileResponse,
  JwtPayload,
} from '@libs/application';
import { JwtAuthGuard, CurrentUser } from '@libs/shared';

/**
 * Controlador de perfil del cliente.
 * PATCH /customer/profile - Actualización parcial del perfil (solo campos enviados).
 */
@ApiTags('Profile')
@Controller('profile')
export class CustomerProfileController {
  constructor(private readonly patchCustomerProfileHandler: PatchCustomerProfileHandler) {}

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar perfil (parcial)',
    description:
      'Actualiza solo los campos enviados en el body. Los no enviados se mantienen. Al menos un campo es requerido.',
  })
  @ApiBody({ type: PatchCustomerProfileRequest })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado',
    type: UpdateMyProfileResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Ningún campo enviado o validación fallida',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async patchProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: PatchCustomerProfileRequest,
  ): Promise<UpdateMyProfileResponse> {
    return this.patchCustomerProfileHandler.execute(user.userId, body);
  }
}
